import { eq, sql } from 'drizzle-orm';
import { db } from '../../utils/db';
import { rooms, room_lock_history, projector_history } from '../../utils/schema';

export default defineEventHandler(async () => {

  const activeLabsResult = await db.select({ count: sql<number>`count(*)` })
    .from(rooms)
    .where(sql`${rooms.status} = 'open' AND ${rooms.projector_status} = true`);
  const activeLabsCount = Number(activeLabsResult[0]?.count || 0);


  const unlockIncidentsResult = await db.execute(sql`
    WITH paired_locks AS (
        SELECT 
            room_id,
            status,
            recorded_at AS opened_at,
            LEAD(recorded_at) OVER (PARTITION BY room_id ORDER BY recorded_at) AS closed_at
        FROM room_lock_history
    )
    SELECT COUNT(*)::int AS count
    FROM paired_locks
    WHERE status = 'open'
      AND opened_at >= date_trunc('month', CURRENT_DATE) -- Hanya bulan ini
      AND (
        -- KASUS A: Sempat ditutup, tapi setelah dibiarkan terbuka > 12 jam
        (closed_at IS NOT NULL AND EXTRACT(EPOCH FROM (closed_at - opened_at)) / 3600 > 12)
        OR 
        -- KASUS B: Masih terbuka sampai detik ini, dan sudah lewat dari 12 jam
        (closed_at IS NULL AND EXTRACT(EPOCH FROM (NOW() - opened_at)) / 3600 > 12)
      )
  `);

  const unlockIncidentsCount = Number(unlockIncidentsResult[0]?.count || 0);


  const uptimeResult = await db.select({
    total_seconds: sql<number>`SUM(EXTRACT(EPOCH FROM (COALESCE(turned_off_at, NOW()) - turned_on_at)))`
  })
  .from(projector_history)
  .where(sql`turned_on_at >= NOW() - INTERVAL '7 days'`);

  const totalUptimeHours = Number((uptimeResult[0]?.total_seconds || 0) / 3600);

  const totalPowerConsumption = Number((totalUptimeHours * 0.3).toFixed(1));


  const dailyUptimeResult = await db.select({
    day_name: sql<string>`to_char(turned_on_at, 'Dy')`,
    day_idx: sql<number>`EXTRACT(ISODOW FROM turned_on_at)`,
    daily_seconds: sql<number>`SUM(EXTRACT(EPOCH FROM (COALESCE(turned_off_at, NOW()) - turned_on_at)))`
  })
  .from(projector_history)
  .where(sql`turned_on_at >= NOW() - INTERVAL '7 days'`)
  .groupBy(sql`1, 2`)
  .orderBy(sql`2`);

  let maxSeconds = 0;
  dailyUptimeResult.forEach(row => {
    if (row.daily_seconds > maxSeconds) maxSeconds = row.daily_seconds;
  });

  const chartData = dailyUptimeResult.map(row => {
    const percent = maxSeconds > 0 ? Math.round((row.daily_seconds / maxSeconds) * 100) : 0;
    return {
      day: row.day_name,
      percent: percent
    };
  });

  const allRooms = await db.select().from(rooms);

  return {
    success: true,
    data: {
      activeLabs: activeLabsCount,
      warnings: unlockIncidentsCount >= 3 ? 1 : 0, 
      unlockIncidents: unlockIncidentsCount,
      totalUptime: totalUptimeHours.toFixed(1),
      totalPowerConsumption: totalPowerConsumption,
      chartData: chartData.length > 0 ? chartData : [{ day: '-', percent: 0 }],
      rooms: allRooms.map(r => ({
        id: r.id,
        num: r.num,
        status: r.status === 'open' ? (r.projector_status ? 'Active' : 'Warning') : 'Inactive'
      }))
    }
  };
});