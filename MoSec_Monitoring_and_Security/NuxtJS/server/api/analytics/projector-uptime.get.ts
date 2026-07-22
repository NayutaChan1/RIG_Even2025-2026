import { sql } from 'drizzle-orm';
import { db } from '../../utils/db';
import { rooms, projector_history } from '../../utils/schema';

const KWH_PER_HOUR = 0.3;

// Per-room projector uptime over the last 7 days + building totals (from DB).
export default defineEventHandler(async () => {
  const allRooms = await db.select().from(rooms);

  // Latest on/off state per room.
  const projectorResult = await db.execute(sql`
    SELECT DISTINCT ON (room_id) room_id,
      CASE WHEN turned_off_at IS NULL THEN true ELSE false END AS is_on
    FROM projector_history
    ORDER BY room_id, turned_on_at DESC
  `) as { room_id: string; is_on: boolean }[];
  const onMap = new Map(projectorResult.map(p => [p.room_id, p.is_on]));

  // Sum uptime seconds per room over the last 7 days.
  const histories = await db
    .select()
    .from(projector_history)
    .where(sql`${projector_history.turned_on_at} >= NOW() - INTERVAL '7 days'`);

  const secondsByRoom = new Map<string, number>();
  for (const row of histories) {
    if (!row.turned_on_at) continue;
    const end = row.turned_off_at ?? new Date();
    const seconds = (end.getTime() - row.turned_on_at.getTime()) / 1000;
    secondsByRoom.set(row.room_id, (secondsByRoom.get(row.room_id) ?? 0) + seconds);
  }

  const roomUptime = allRooms
    .map(room => ({
      roomId: room.id,
      roomName: room.name,
      totalHours: Number(((secondsByRoom.get(room.id) ?? 0) / 3600).toFixed(1)),
      projectorOn: onMap.get(room.id) ?? false,
    }))
    .sort((a, b) => b.totalHours - a.totalHours);

  const totalHours = Number(roomUptime.reduce((sum, r) => sum + r.totalHours, 0).toFixed(1));
  const totalPowerKwh = Number((totalHours * KWH_PER_HOUR).toFixed(1));

  return {
    success: true,
    data: {
      totalHours,
      totalPowerKwh,
      rooms: roomUptime,
    },
  };
});
