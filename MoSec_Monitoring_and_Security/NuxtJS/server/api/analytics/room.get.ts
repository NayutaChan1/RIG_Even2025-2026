import { eq, sql, and } from 'drizzle-orm';
import { db } from '../../utils/db';
import { rooms, door_lock_history, projector_history } from '../../utils/schema';
import { getActiveBorrowings } from '../../utils/borrow-status';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const targetRoomId = query.roomId as string;

  if (!targetRoomId) {
    throw createError({ statusCode: 400, message: 'Parameter roomId wajib dikirim!' });
  }

  const room = await db.select().from(rooms).where(eq(rooms.id, targetRoomId)).limit(1);
  if (room.length === 0) {
    throw createError({ statusCode: 404, message: `Ruangan ${targetRoomId} tidak ditemukan` });
  }

  // Latest door & projector state (from DB, fed by the IoT sender via POST).
  const doorResult = await db.execute(sql`
    SELECT status FROM door_lock_history
    WHERE room_id = ${targetRoomId}
    ORDER BY recorded_at DESC
    LIMIT 1
  `) as { status: string }[];

  const projectorResult = await db.execute(sql`
    SELECT turned_off_at IS NULL AS is_on
    FROM projector_history
    WHERE room_id = ${targetRoomId}
    ORDER BY turned_on_at DESC
    LIMIT 1
  `) as { is_on: boolean }[];

  const isOpen = doorResult.length > 0 ? doorResult[0]!.status === 'open' : false;
  const projectorOn = projectorResult.length > 0 ? projectorResult[0]!.is_on : false;

  // Status ruangan dari Messier borrowings + sensor
  let roomStatus: 'Active' | 'Warning' | 'Inactive' = 'Inactive';
  let borrowing: unknown;

  const authUser = getCookie(event, 'auth_user');
  if (authUser) {
    try {
      const parsed = JSON.parse(authUser);
      if (parsed.token) {
        const borrowings = await getActiveBorrowings(parsed.token);
        const roomName = room[0]!.name;
        borrowing = borrowings.filter(tx => tx.roomNumber == roomName)[0];
        if (borrowing) roomStatus = 'Active';
      }
    } catch {
      // Messier unreachable — fall through to sensor-based status
    }
  }

  if (roomStatus !== 'Active') {
    roomStatus = (isOpen || projectorOn) ? 'Warning' : 'Inactive';
  }

  // Insiden bulan ini (dari histori DB)
  // "Room left unlocked" = number of times the door was recorded as opened this month.
  const unlockRes = await db.execute(sql`
    SELECT COUNT(*)::int AS count
    FROM door_lock_history
    WHERE room_id = ${targetRoomId}
      AND status = 'open'
      AND recorded_at >= date_trunc('month', CURRENT_DATE)
  `) as { count: number }[];
  const unlockIncidentsCount = Number(unlockRes[0]?.count || 0);

  // "Projector left on" = number of projector sessions started this month.
  const projRes = await db.execute(sql`
    SELECT COUNT(*)::int AS count
    FROM projector_history
    WHERE room_id = ${targetRoomId}
      AND turned_on_at >= date_trunc('month', CURRENT_DATE)
  `) as { count: number }[];
  const projectorIncidentsCount = Number(projRes[0]?.count || 0);

  // Uptime proyektor minggu ini
  const uptimeResult = await db.select({
    total_seconds: sql<number>`SUM(EXTRACT(EPOCH FROM (COALESCE(turned_off_at, NOW()) - turned_on_at)))`
  })
    .from(projector_history)
    .where(and(
      eq(projector_history.room_id, targetRoomId),
      sql`turned_on_at >= NOW() - INTERVAL '7 days'`
    ));
  const totalUptimeHours = Number((uptimeResult[0]?.total_seconds || 0) / 3600);

  // Grafik harian (7 hari)
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
      roomName: `Lab ${room[0]?.name}`,
      status: roomStatus,
      projectorOn,
      doorLocked: !isOpen,
      totalUptime: totalUptimeHours.toFixed(1),
      unlockIncidents: unlockIncidentsCount,
      projectorIncidents: projectorIncidentsCount,
      chartData: chartData.length > 0 ? chartData : [{ day: '-', percent: 0 }],
      borrowing,
    }
  };
});
