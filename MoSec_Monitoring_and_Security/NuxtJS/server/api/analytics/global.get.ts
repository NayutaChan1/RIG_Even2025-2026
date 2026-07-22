import { sql } from 'drizzle-orm';
import { db } from '../../utils/db';
import { rooms, projector_history } from '../../utils/schema';
import { getActiveBorrowings } from '../../utils/borrow-status';

// Power draw assumption used to turn uptime hours into kWh.
const KWH_PER_HOUR = 0.3;

export default defineEventHandler(async (event) => {

  const allRooms = await db.select().from(rooms);

// LATEST DOOR & PROJECTOR STATE (from DB, fed by the IoT via POST /api/door,/projector) ===========

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

// PROJECTOR UPTIME + DAILY CHART (last 7 days) ====================================================

  const histories = await db
    .select()
    .from(projector_history)
    .where(sql`${projector_history.turned_on_at} >= NOW() - INTERVAL '7 days'`);

  let totalSeconds = 0;
  const daily = new Map<number, number>();

  for (const row of histories) {
    if (!row.turned_on_at) continue;
    const end = row.turned_off_at ?? new Date();
    const seconds = (end.getTime() - row.turned_on_at.getTime()) / 1000;
    totalSeconds += seconds;
    const day = row.turned_on_at.getDay();
    daily.set(day, (daily.get(day) ?? 0) + seconds);
  }

  const totalUptimeHours = totalSeconds / 3600;
  const totalPowerConsumption = Number((totalUptimeHours * KWH_PER_HOUR).toFixed(1));

  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const max = Math.max(...daily.values(), 0);
  const chartData = [...daily.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([day, seconds]) => ({
      day: names[day],
      percent: max === 0 ? 0 : Math.round((seconds / max) * 100),
    }));

// ACTIVE BORROWINGS (from Messier) ================================================================

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

// ROOM STATUS + UNLOCK INCIDENTS =================================================================

  const roomData = allRooms.map(room => {
    const isBorrowed = activeRoomSet.has(room.name);
    const isUnlocked = doorMap.get(room.id) === 'open';
    const projectorOn = projectorMap.get(room.id) ?? false;

    let status: "Active" | "Warning" | "Inactive";
    if (isBorrowed) {
      status = 'Active';
    } else {
      status = (isUnlocked || projectorOn) ? "Warning" : "Inactive";
    }

    return { id: room.id, name: room.name, status, isBorrowed, isUnlocked };
  });

  // Unlock incident = room is NOT borrowed but the latest lock reading is unlocked.
  const unlockIncidentsCount = roomData.filter(
    rm => !rm.isBorrowed && rm.isUnlocked
  ).length;

// ==========================================================================================

  return {
    success: true,
    data: {
      activeLabs: roomData.filter(rm => rm.status === 'Active').length,
      warnings: roomData.filter(rm => rm.status === 'Warning').length,
      unlockIncidents: unlockIncidentsCount,
      totalUptime: totalUptimeHours.toFixed(1),
      totalPowerConsumption: totalPowerConsumption,
      chartData: chartData.length > 0 ? chartData : [{ day: '-', percent: 0 }],
      rooms: roomData.map(({ id, name, status }) => ({ id, name, status })),
    }
  };
});
