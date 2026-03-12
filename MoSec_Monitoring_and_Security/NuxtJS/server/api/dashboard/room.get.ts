import { eq, sql, and } from 'drizzle-orm';
import { db } from '../../utils/db';
import { rooms, room_lock_history, projector_history } from '../../utils/schema';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const targetRoomId = query.roomId as string;

  if (!targetRoomId) {
    throw createError({ statusCode: 400, message: 'Parameter roomId wajib dikirim!' });
  }

  // 1. Ambil Data Dasar Ruangan
  const room = await db.select().from(rooms).where(eq(rooms.id, targetRoomId)).limit(1);
  if (room.length === 0) {
    throw createError({ statusCode: 404, message: `Ruangan ${targetRoomId} tidak ditemukan` });
  }

  // 2. Insiden Pintu Lupa Dikunci (Spesifik Ruangan Ini)
  const unlockIncidentsResult = await db.execute(sql`
    WITH paired_locks AS (
        SELECT 
            status,
            recorded_at AS opened_at,
            LEAD(recorded_at) OVER (ORDER BY recorded_at) AS closed_at
        FROM room_lock_history
        WHERE room_id = ${targetRoomId} -- Filter spesifik ruangan
    )
    SELECT COUNT(*)::int AS count
    FROM paired_locks
    WHERE status = 'open'
      AND opened_at >= date_trunc('month', CURRENT_DATE)
      AND (
        (closed_at IS NOT NULL AND EXTRACT(EPOCH FROM (closed_at - opened_at)) / 3600 > 4)
        OR 
        (closed_at IS NULL AND EXTRACT(EPOCH FROM (NOW() - opened_at)) / 3600 > 4)
      )
  `);
  const unlockIncidentsCount = Number(unlockIncidentsResult[0]?.count || 0);

  // 3. Uptime Proyektor Spesifik Ruangan (Minggu Ini)
  const uptimeResult = await db.select({
    total_seconds: sql<number>`SUM(EXTRACT(EPOCH FROM (COALESCE(turned_off_at, NOW()) - turned_on_at)))`
  })
  .from(projector_history)
  .where(and(
      eq(projector_history.room_id, targetRoomId),
      sql`turned_on_at >= NOW() - INTERVAL '7 days'`
  ));
  const totalUptimeHours = Number((uptimeResult[0]?.total_seconds || 0) / 3600);

  // 4. Data Grafik Harian (Chart Data) Spesifik Ruangan
  const dailyUptimeResult = await db.select({
    day_name: sql<string>`to_char(turned_on_at, 'Dy')`,
    day_idx: sql<number>`EXTRACT(ISODOW FROM turned_on_at)`,
    daily_seconds: sql<number>`SUM(EXTRACT(EPOCH FROM (COALESCE(turned_off_at, NOW()) - turned_on_at)))`
  })
  .from(projector_history)
  .where(and(
      eq(projector_history.room_id, targetRoomId),
      sql`turned_on_at >= NOW() - INTERVAL '7 days'`
  ))
  .groupBy(sql`1, 2`)
  .orderBy(sql`2`);

  let maxSeconds = 0;
  dailyUptimeResult.forEach(row => { if (row.daily_seconds > maxSeconds) maxSeconds = row.daily_seconds; });

  const chartData = dailyUptimeResult.map(row => ({
    day: row.day_name,
    percent: maxSeconds > 0 ? Math.round((row.daily_seconds / maxSeconds) * 100) : 0
  }));

  return {
    success: true,
    data: {
      roomId: room[0]?.id,
      roomName: `Lab ${room[0]?.num}`,
      projectorOn: room[0]?.projector_status,
      doorLocked: room[0]?.status === 'closed',
      totalUptime: totalUptimeHours.toFixed(1),
      unlockIncidents: unlockIncidentsCount,
      chartData: chartData.length > 0 ? chartData : [{ day: '-', percent: 0 }]
    }
  };
});