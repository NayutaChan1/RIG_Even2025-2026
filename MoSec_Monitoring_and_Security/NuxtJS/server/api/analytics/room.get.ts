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

  // 1. Ambil Data Dasar Ruangan
  const room = await db.select().from(rooms).where(eq(rooms.id, targetRoomId)).limit(1);
  if (room.length === 0) {
    throw createError({ statusCode: 404, message: `Ruangan ${targetRoomId} tidak ditemukan` });
  }

  // Current door & projector state from history
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

  // 2. Status ruangan dari Messier borrowings + sensor
  let roomStatus: 'Active' | 'Warning' | 'Inactive' = 'Inactive';
  let borrowings: unknown[] = [];

  const authUser = getCookie(event, 'auth_user');
  if (authUser) {
    try {
      const parsed = JSON.parse(authUser);
      if (parsed.token) {
        const messierData = await getActiveBorrowings(parsed.token);
        const transactions = extractTransactions(messierData);
        borrowings = transactions;

        const roomName = room[0]!.name;
        const hasBorrowing = transactions.some(tx =>
          matchesRoom(tx, roomName)
        );

        if (hasBorrowing) {
          roomStatus = 'Active';
        }
      }
    } catch {
      // Messier unreachable — fall through to sensor-based status
    }
  }

  if (roomStatus !== 'Active') {
    if (isOpen && projectorOn) {
      roomStatus = 'Active';
    } else if (isOpen && !projectorOn) {
      roomStatus = 'Warning';
    } else {
      roomStatus = 'Inactive';
    }
  }

  // 3. Insiden Pintu Lupa Dikunci (Spesifik Ruangan Ini)
  const unlockIncidentsResult = await db.execute(sql`
    WITH paired_locks AS (
        SELECT 
            status,
            recorded_at AS opened_at,
            LEAD(recorded_at) OVER (ORDER BY recorded_at) AS closed_at
        FROM door_lock_history
        WHERE room_id = ${targetRoomId}
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

  // 4. Uptime Proyektor Spesifik Ruangan (Minggu Ini)
  const uptimeResult = await db.select({
    total_seconds: sql<number>`SUM(EXTRACT(EPOCH FROM (COALESCE(turned_off_at, NOW()) - turned_on_at)))`
  })
  .from(projector_history)
  .where(and(
      eq(projector_history.room_id, targetRoomId),
      sql`turned_on_at >= NOW() - INTERVAL '7 days'`
  ));
  const totalUptimeHours = Number((uptimeResult[0]?.total_seconds || 0) / 3600);

  // 5. Data Grafik Harian (Chart Data) Spesifik Ruangan
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
      chartData: chartData.length > 0 ? chartData : [{ day: '-', percent: 0 }],
      borrowings,
    }
  };
});

function extractTransactions(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    for (const key of ['data', 'Data', 'transactions', 'Transactions', 'value', 'Value', 'result', 'Result']) {
      const v = d[key];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
}

function matchesRoom(tx: unknown, roomName: string): boolean {
  if (tx && typeof tx === 'object') {
    const t = tx as Record<string, unknown>;
    for (const key of ['room_id', 'RoomId', 'room', 'Room', 'roomNumber', 'RoomNumber', 'lab', 'Lab']) {
      const v = t[key];
      if (v !== undefined && v !== null) {
        if (String(v) === roomName) return true;
      }
    }
  }
  return false;
}
