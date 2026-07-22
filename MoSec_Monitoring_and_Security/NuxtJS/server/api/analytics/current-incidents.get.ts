import { sql } from 'drizzle-orm';
import { db } from '../../utils/db';
import { rooms } from '../../utils/schema';
import { getActiveBorrowings } from '../../utils/borrow-status';

// Live "right now" incidents: rooms whose latest lock reading is UNLOCKED while
// there is no active borrowing. Matches the dashboard "Unlocked Incidents" count.
export default defineEventHandler(async (event) => {
  const allRooms = await db.select().from(rooms);

  const doorResult = await db.execute(sql`
    SELECT DISTINCT ON (room_id) room_id, status
    FROM door_lock_history
    ORDER BY room_id, recorded_at DESC
  `) as { room_id: string; status: string }[];
  const doorMap = new Map(doorResult.map(d => [d.room_id, d.status]));

  const projectorResult = await db.execute(sql`
    SELECT DISTINCT ON (room_id) room_id,
      CASE WHEN turned_off_at IS NULL THEN true ELSE false END AS is_on
    FROM projector_history
    ORDER BY room_id, turned_on_at DESC
  `) as { room_id: string; is_on: boolean }[];
  const projectorMap = new Map(projectorResult.map(p => [p.room_id, p.is_on]));

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

  const activeBorrowings = await getActiveBorrowings(parsed.token);
  const activeRoomSet = new Set(activeBorrowings.map(b => String(b.roomNumber)));

  const incidents = allRooms
    .filter(room => !activeRoomSet.has(room.name) && doorMap.get(room.id) === 'open')
    .map(room => ({
      roomId: room.id,
      roomName: room.name,
      projectorOn: projectorMap.get(room.id) ?? false,
    }));

  return {
    success: true,
    data: {
      count: incidents.length,
      checkedAt: new Date().toISOString(),
      incidents,
    },
  };
});
