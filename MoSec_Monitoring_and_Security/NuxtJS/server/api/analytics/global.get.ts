import { eq, sql } from 'drizzle-orm';
import { db } from '../../utils/db';
import { rooms, door_lock_history, projector_history } from '../../utils/schema';
import { getActiveBorrowings } from '~~/server/utils/borrow-status';

export default defineEventHandler(async (event) => {

// LATEST DOOR & PROJECTOR STATUS ====================================================================

  const doorResult = await db.execute(sql`
    SELECT DISTINCT ON (room_id) room_id, status
    FROM door_lock_history
    ORDER BY room_id, recorded_at DESC
  `) as { room_id: string; status: string }[];

  const projectorResult = await db.execute(sql`
    SELECT DISTINCT ON (room_id) room_id,
      CASE WHEN turned_off_at IS NULL THEN true ELSE false END AS is_on
    FROM projector_history
    ORDER BY room_id, turned_on_at DESC
  `) as { room_id: string; is_on: boolean }[];

  const doorMap = new Map(doorResult.map(d => [d.room_id, d.status]));
  const projectorMap = new Map(projectorResult.map(p => [p.room_id, p.is_on]));

// // ACTIVE LABS =======================================================================================

  const allRooms = await db.select().from(rooms);
//   const activeLabsCount = allRooms.filter(r =>
//     doorMap.get(r.id) === 'open' && projectorMap.get(r.id)
//   ).length;

// UNLOCKED ROOMS INCIDENTS ==============================================================================

  const history = await db
  .select()
  .from(door_lock_history)
  .where(sql`${door_lock_history.recorded_at} >= date_trunc('month', CURRENT_DATE)`)
  .orderBy(door_lock_history.room_id, door_lock_history.recorded_at);

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

  const authUser = getCookie(event, 'auth_user');

  if (!authUser) {
    throw createError({ statusCode: 401, message: 'Not authenticated' });
  }

  let parsed: { token?: string };
  try {
    parsed = JSON.parse(authUser);
  } catch {
    throw createError({ statusCode: 401, message: 'Invalid auth cookie' });
  }

  if (!parsed.token) {
    throw createError({ statusCode: 401, message: 'No Messier token found' });
  }

  // from active room borrowing (not transaction)
  const activeBorrowings = await getActiveBorrowings(parsed.token);
  const activeRoomSet = new Set(
    activeBorrowings.map(b => String(b.roomNumber))
  );

  const roomData = allRooms.map(room => {
    const hasTransaction = activeRoomSet.has(room.name);
    const isUnlocked = doorMap.get(room.id) === 'open';
    const projectorOn = projectorMap.get(room.id) ?? false;

    let status: "Active" | "Warning" | "Inactive";

    if (hasTransaction) {
      status = 'Active';
    } else {
      if (isUnlocked || projectorOn) {
        status = "Warning";
      } else {
        status = "Inactive";
      }
    }

    return {
      id: room.id,
      name: room.name,
      status,
    };
  });

  console.log(roomData.filter(rm => rm.status === 'Active'));
  console.log(roomData.filter(rm => rm.status === 'Warning'));

  return {
    success: true,
    data: {
      activeLabs: roomData.filter(rm => rm.status === 'Active').length, 
      warnings: roomData.filter(rm => rm.status === 'Warning').length, 
      unlockIncidents: unlockIncidentsCount,
      totalUptime: totalUptimeHours.toFixed(1),
      totalPowerConsumption: totalPowerConsumption,
      chartData: chartData.length > 0 ? chartData : [{ day: '-', percent: 0 }],
      rooms: roomData
    }
  };
});
