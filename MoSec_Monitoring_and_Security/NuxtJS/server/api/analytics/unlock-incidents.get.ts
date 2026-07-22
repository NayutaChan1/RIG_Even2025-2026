import { desc, eq } from 'drizzle-orm';
import { db } from '../../utils/db';
import { rooms, door_lock_history } from '../../utils/schema';

// History of "room left unlocked" events, grouped by month (from DB).
// Each door 'open' reading recorded by the IoT counts as one incident.
export default defineEventHandler(async () => {
  const allRooms = await db.select().from(rooms);
  const roomName = new Map(allRooms.map(r => [r.id, r.name]));

  const openEvents = await db
    .select({
      room_id: door_lock_history.room_id,
      recorded_at: door_lock_history.recorded_at,
    })
    .from(door_lock_history)
    .where(eq(door_lock_history.status, 'open'))
    .orderBy(desc(door_lock_history.recorded_at));

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const groups = new Map<string, {
    key: string;
    label: string;
    count: number;
    incidents: { roomName: string; at: string }[];
  }>();

  for (const ev of openEvents) {
    if (!ev.recorded_at) continue;
    const d = new Date(ev.recorded_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
        count: 0,
        incidents: [],
      });
    }

    const group = groups.get(key)!;
    group.count++;
    group.incidents.push({
      roomName: roomName.get(ev.room_id) ?? ev.room_id,
      at: d.toISOString(),
    });
  }

  return {
    success: true,
    data: {
      total: openEvents.length,
      months: [...groups.values()],
    },
  };
});
