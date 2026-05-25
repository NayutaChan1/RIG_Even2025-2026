import { eq, sql } from 'drizzle-orm';
import { db } from '../../utils/db';
import { rooms } from '../../utils/schema';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const roomId = String(query.roomId || '').trim();
  const selectedDate = String(query.date || '').trim();

  if (!roomId) {
    throw createError({ statusCode: 400, message: 'Parameter roomId wajib dikirim' });
  }

  const targetDate = selectedDate || new Date().toISOString().slice(0, 10);
  const targetDateStart = `${targetDate} 00:00:00`;
  const targetDateEnd = `${targetDate} 23:59:59`;

  const room = await db.select({
    id: rooms.id,
    num: rooms.num,
    status: rooms.status,
    projectorStatus: rooms.projector_status,
    projectorLastOn: rooms.projector_last_on,
    projectorLastOff: rooms.projector_last_off,
  }).from(rooms).where(eq(rooms.id, roomId)).limit(1);

  if (room.length === 0) {
    throw createError({ statusCode: 404, message: `Ruangan ${roomId} tidak ditemukan` });
  }

  const uptimeResult = await db.execute(sql`
    WITH clipped_sessions AS (
      SELECT
        GREATEST(turned_on_at, ${targetDateStart}::timestamp) AS session_start,
        LEAST(COALESCE(turned_off_at, NOW()), ${targetDateEnd}::timestamp) AS session_end
      FROM projector_history
      WHERE room_id = ${roomId}
        AND turned_on_at IS NOT NULL
        AND COALESCE(turned_off_at, NOW()) >= ${targetDateStart}::timestamp
        AND turned_on_at < (${targetDateStart}::timestamp + INTERVAL '1 day')
    )
    SELECT
      COALESCE(SUM(EXTRACT(EPOCH FROM (session_end - session_start))), 0) AS total_seconds
    FROM clipped_sessions
  `) as Array<Record<string, string | number | null>>;

  const dailyResult = await db.execute(sql`
    WITH days AS (
      SELECT generate_series(
        (${targetDateStart}::date - INTERVAL '5 days'),
        ${targetDateStart}::date,
        INTERVAL '1 day'
      )::date AS day_start
    )
    SELECT
      d.day_start,
      COALESCE(
        SUM(
          CASE
            WHEN p.turned_on_at IS NULL THEN 0
            ELSE GREATEST(
              0,
              EXTRACT(EPOCH FROM (
                LEAST(COALESCE(p.turned_off_at, NOW()), d.day_start + INTERVAL '1 day')
                - GREATEST(p.turned_on_at, d.day_start)
              ))
            )
          END
        ),
        0
      ) AS total_seconds
    FROM days d
    LEFT JOIN projector_history p
      ON p.room_id = ${roomId}
     AND p.turned_on_at IS NOT NULL
     AND p.turned_on_at < (d.day_start + INTERVAL '1 day')
     AND COALESCE(p.turned_off_at, NOW()) > d.day_start
    GROUP BY d.day_start
    ORDER BY d.day_start ASC
  `) as Array<Record<string, string | number | null>>;

  const shiftResult = await db.execute(sql`
    WITH clipped_sessions AS (
      SELECT
        GREATEST(turned_on_at, ${targetDateStart}::timestamp) AS session_start,
        LEAST(COALESCE(turned_off_at, NOW()), ${targetDateEnd}::timestamp) AS session_end
      FROM projector_history
      WHERE room_id = ${roomId}
        AND turned_on_at IS NOT NULL
        AND COALESCE(turned_off_at, NOW()) >= ${targetDateStart}::timestamp
        AND turned_on_at < (${targetDateStart}::timestamp + INTERVAL '1 day')
    ),
    shifts AS (
      SELECT * FROM (VALUES
        (1, '07:00-09:00', TIME '07:00', TIME '09:00'),
        (2, '09:00-11:00', TIME '09:00', TIME '11:00'),
        (3, '11:00-13:00', TIME '11:00', TIME '13:00'),
        (4, '13:00-15:00', TIME '13:00', TIME '15:00'),
        (5, '15:00-17:00', TIME '15:00', TIME '17:00'),
        (6, '17:00-19:00', TIME '17:00', TIME '19:00')
      ) AS s(shift_no, shift_label, shift_start, shift_end)
    )
    SELECT
      s.shift_no,
      s.shift_label,
      COALESCE(
        SUM(
          CASE
            WHEN c.session_start IS NULL THEN 0
            ELSE GREATEST(
              0,
              EXTRACT(EPOCH FROM (
                LEAST(c.session_end, ${targetDateStart}::timestamp + s.shift_end)
                - GREATEST(c.session_start, ${targetDateStart}::timestamp + s.shift_start)
              ))
            )
          END
        ),
        0
      ) AS total_seconds
    FROM shifts s
    LEFT JOIN clipped_sessions c
      ON c.session_start < (${targetDateStart}::timestamp + s.shift_end)
     AND c.session_end > (${targetDateStart}::timestamp + s.shift_start)
    GROUP BY s.shift_no, s.shift_label
    ORDER BY s.shift_no ASC
  `) as Array<Record<string, string | number | null>>;

  const totalSeconds = Number(uptimeResult[0]?.total_seconds || 0);

  const dailyUptime = dailyResult.map((row) => ({
    day: new Date(String(row.day_start || '')).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: '2-digit' }),
    date: String(row.day_start || '').slice(0, 10),
    totalSeconds: Number(row.total_seconds || 0),
    totalHours: Number((Number(row.total_seconds || 0) / 3600).toFixed(2)),
  }));

  const shiftUptime = shiftResult.map((row) => ({
    shiftNo: Number(row.shift_no || 0),
    shiftLabel: String(row.shift_label || '-'),
    totalSeconds: Number(row.total_seconds || 0),
    totalHours: Number((Number(row.total_seconds || 0) / 3600).toFixed(2)),
  }));

  const dailyPeakHours = Math.max(...dailyUptime.map((item) => item.totalHours), 0);
  const shiftPeakHours = Math.max(...shiftUptime.map((item) => item.totalHours), 0);

  return {
    success: true,
    data: {
      room: {
        id: room[0]!.id,
        num: room[0]!.num,
        status: room[0]!.status,
        projectorStatus: room[0]!.projectorStatus,
        projectorLastOn: room[0]!.projectorLastOn,
        projectorLastOff: room[0]!.projectorLastOff,
      },
      windowDays: 30,
      uptime: {
        totalSeconds,
        totalHours: Number((totalSeconds / 3600).toFixed(2)),
        totalDays: Number((totalSeconds / 86400).toFixed(2)),
        dailyPeakHours,
        shiftPeakHours,
        dailyUptime,
        shiftUptime,
        selectedDate: targetDate,
      },
    },
  };
});