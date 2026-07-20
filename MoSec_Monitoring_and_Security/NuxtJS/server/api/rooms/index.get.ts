import { db } from "../../utils/db";
import {
  rooms,
  door_lock_history,
  projector_history,
} from "../../utils/schema";
import { desc, sql } from "drizzle-orm";
import { getActiveBorrowings } from "~~/server/utils/borrow-status";

export default defineEventHandler(async (event) => {
  const allRooms = await db.select().from(rooms).orderBy(rooms.name);

  const doorResult = await db
    .selectDistinctOn([door_lock_history.room_id], {
      room_id: door_lock_history.room_id,
      status: door_lock_history.status,
    })
    .from(door_lock_history)
    .orderBy(door_lock_history.room_id, desc(door_lock_history.recorded_at));

  const projectorResult = await db
    .selectDistinctOn([projector_history.room_id], {
      room_id: projector_history.room_id,
      is_on: sql<boolean>`
      CASE
        WHEN ${projector_history.turned_off_at} IS NULL THEN true
        ELSE false
      END
    `.as("is_on"),
    })
    .from(projector_history)
    .orderBy(projector_history.room_id, desc(projector_history.turned_on_at));

  const doorMap = new Map(doorResult.map((d) => [d.room_id, d.status]));
  const projectorMap = new Map(
    projectorResult.map((p) => [p.room_id, p.is_on]),
  );

  // Fetch active borrowings from Messier
  let borrowingsByRoom = new Map<
    string,
    { username: string; division: string; identityCode: string }
  >();
  const authUser = getCookie(event, "auth_user");
  if (authUser) {
    try {
      const parsed = JSON.parse(authUser);
      if (parsed.token) {
        const activeBorrowings = await getActiveBorrowings(parsed.token);
        for (const b of activeBorrowings) {
          borrowingsByRoom.set(String(b.roomNumber), b.borrower);
        }
      }
    } catch {
      // Messier unreachable — omit borrower data
    }
  }

  const formattedRooms = allRooms.map((r) => {
    const borrower = borrowingsByRoom.get(r.name);
    const isOpen = doorMap.get(r.id) === "open";
    const projectorOn = projectorMap.get(r.id) ?? false;

    let status = "Active";

    if (!borrower) {
      if (isOpen || projectorOn) {
        status = "Warning";
      } else {
        status = "Inactive";
      }
    }

    return {
      id: r.id,
      name: r.name,
      projectorOn,
      doorLocked: !isOpen,
      status,
      borrower: borrower || null,
    };
  });

  return {
    success: true,
    data: formattedRooms,
  };
});
