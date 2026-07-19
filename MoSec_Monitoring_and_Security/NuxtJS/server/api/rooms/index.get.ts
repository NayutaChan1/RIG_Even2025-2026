import { db } from '../../utils/db';
import { rooms, door_lock_history, projector_history } from '../../utils/schema';
import { sql } from 'drizzle-orm';

export default defineEventHandler(async () => {
  const allRooms = await db.select().from(rooms).orderBy(rooms.name);

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

  const formattedRooms = allRooms.map(r => {
    const isOpen = doorMap.get(r.id) === 'open';
    const projectorOn = projectorMap.get(r.id) ?? false;

    let badgeStatus = 'inactive';
    let badgeText = 'Inactive';

    if (isOpen && projectorOn) {
      badgeStatus = 'active';
      badgeText = 'Active';
    } else if (isOpen && !projectorOn) {
      badgeStatus = 'warning';
      badgeText = 'Warning';
    }

    return {
      id: r.id,
      name: `Lab ${r.name}`,
      projectorOn,
      doorLocked: !isOpen,
      badgeStatus,
      badgeText,
    };
  });

  return {
    success: true,
    data: formattedRooms
  };
});