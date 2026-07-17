import { and, eq, sql } from 'drizzle-orm';
import { db } from '../../utils/db';
import { rooms, room_lock_history, projector_history } from '../../utils/schema';

export default defineEventHandler(async () => {

// ACTIVE LABS =======================================================================================

  // TODO change to be based on the borrowed rooms at that time
  const activeLabs = await db
  .select()
  .from(rooms)
  .where(
    and(
      eq(rooms.status, 'open'),
      eq(rooms.projector_status, true)
    )
  );

  const activeLabsCount = activeLabs.length;

// UNLOCKED ROOMS INCIDENTS ==============================================================================

  // get room lock history logs
  const history = await db
  .select()
  .from(room_lock_history)
  .where(sql`${room_lock_history.recorded_at} >= date_trunc('month', CURRENT_DATE)`)
  .orderBy(room_lock_history.room_id, room_lock_history.recorded_at);

  // TODO only include to indcident if by those 2 hours there are no borrowing
  const TWO_HOURS = 2 * 60 * 60 * 1000;
  let unlockIncidentsResult = 0;
  const grouped = new Map<string, typeof history>();

  for (const h of history) {
    if (!grouped.has(h.room_id))
      grouped.set(h.room_id, []);
    grouped.get(h.room_id)!.push(h);
  }

  for (const logs of grouped.values()) {
    for (let i = 0; i < logs.length; i++) {
      if (logs[i]!.status !== 'open')
        continue;
      const opened = logs[i]!.recorded_at!;
      const closed =
        logs
          .slice(i + 1)
          .find(x => x.status === 'closed')
          ?.recorded_at ?? new Date();

      if (closed.getTime() - opened.getTime() > TWO_HOURS)
        unlockIncidentsResult++;
    }
  }

  // TODO change to list of rooms (room, time last unlocked to last locked)
  let unlockIncidentsCount = unlockIncidentsResult;

// PROJECTOR UPTIME =================================================================================

  const histories = await db
  .select()
  .from(projector_history)
  .where(sql`${projector_history.turned_on_at} >= NOW() - INTERVAL '7 days'`);

  let totalSeconds = 0;
  for (const row of histories) {
      if (!row.turned_on_at)
          continue;

      const end = row.turned_off_at ?? new Date();
      totalSeconds +=
          (end.getTime() - row.turned_on_at.getTime()) / 1000;
  }

  const totalUptimeHours = totalSeconds / 3600;
  const totalPowerConsumption = Number((totalUptimeHours * 0.3).toFixed(1));

// DAILY CHART ===============================================================================

  const daily = new Map<number, number>();

  for (const row of histories) {
      if (!row.turned_on_at)
          continue;

      const end = row.turned_off_at ?? new Date();
      const seconds = (end.getTime() - row.turned_on_at.getTime()) / 1000;
      const day = row.turned_on_at.getDay();
      daily.set(day, (daily.get(day) ?? 0) + seconds);
  }

  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const max = Math.max(...daily.values(), 0);

  const chartData = [...daily.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([day, seconds]) => ({
          day: names[day],
          percent: max === 0
              ? 0
              : Math.round(seconds / max * 100)
      }));

// ==========================================================================================

  // TODO change to get rooms in frontend
  const allRooms = await db.select().from(rooms);

  const roomData = allRooms.map(room => ({
      id: room.id,
      num: room.num,
      status:
          room.status === "open"
              ? room.projector_status
                  ? "Active"
                  : "Warning"
              : "Inactive"
  }));

  return {
    success: true,
    data: {
      activeLabs: activeLabsCount, 
      warnings: unlockIncidentsCount >= 3 ? 1 : 0, 
      unlockIncidents: unlockIncidentsCount,
      totalUptime: totalUptimeHours.toFixed(1),
      totalPowerConsumption: totalPowerConsumption,
      chartData: chartData.length > 0 ? chartData : [{ day: '-', percent: 0 }],
      rooms: roomData
    }
  };
});


  // const unlockIncidentsResult = await db.execute(sql`
  //   WITH paired_locks AS (
  //       SELECT 
  //           room_id,
  //           status,
  //           recorded_at AS opened_at,
  //           LEAD(recorded_at) OVER (PARTITION BY room_id ORDER BY recorded_at) AS closed_at
  //       FROM room_lock_history
  //   )
  //   SELECT COUNT(*)::int AS count
  //   FROM paired_locks
  //   WHERE status = 'open'
  //     AND opened_at >= date_trunc('month', CURRENT_DATE) -- Hanya bulan ini
  //     AND (
  //       -- KASUS A: Sempat ditutup, tapi setelah dibiarkan terbuka > 12 jam
  //       (closed_at IS NOT NULL AND EXTRACT(EPOCH FROM (closed_at - opened_at)) / 3600 > 12)
  //       OR 
  //       -- KASUS B: Masih terbuka sampai detik ini, dan sudah lewat dari 12 jam
  //       (closed_at IS NULL AND EXTRACT(EPOCH FROM (NOW() - opened_at)) / 3600 > 12)
  //     )
  // `);



  // const uptimeResult = await db.select({
  //   total_seconds: sql<number>`SUM(EXTRACT(EPOCH FROM (COALESCE(turned_off_at, NOW()) - turned_on_at)))`
  // })
  // .from(projector_history)
  // .where(sql`turned_on_at >= NOW() - INTERVAL '7 days'`);
  // const totalUptimeHours = Number((uptimeResult[0]?.total_seconds || 0) / 3600);
  // const totalPowerConsumption = Number((totalUptimeHours * 0.3).toFixed(1));


  // const dailyUptimeResult = await db.select({
  //   day_name: sql<string>`to_char(turned_on_at, 'Dy')`,
  //   day_idx: sql<number>`EXTRACT(ISODOW FROM turned_on_at)`,
  //   daily_seconds: sql<number>`SUM(EXTRACT(EPOCH FROM (COALESCE(turned_off_at, NOW()) - turned_on_at)))`
  // })
  // .from(projector_history)
  // .where(sql`turned_on_at >= NOW() - INTERVAL '7 days'`)
  // .groupBy(sql`1, 2`)
  // .orderBy(sql`2`);



   // let maxSeconds = 0;
  // dailyUptimeResult.forEach(row => {
  //   if (row.daily_seconds > maxSeconds) maxSeconds = row.daily_seconds;
  // });

  // const chartData = dailyUptimeResult.map(row => {
  //   const percent = maxSeconds > 0 ? Math.round((row.daily_seconds / maxSeconds) * 100) : 0;
  //   return {
  //     day: row.day_name,
  //     percent: percent
  //   };
  // });