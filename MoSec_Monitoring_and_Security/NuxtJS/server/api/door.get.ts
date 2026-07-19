import { eq, sql } from 'drizzle-orm';
import { db } from '../utils/db';
import { rooms, door_lock_history } from '../utils/schema';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);

    if (query.roomId) {
        const roomId = String(query.roomId);
        const room = await db.select({ id: rooms.id, name: rooms.name })
            .from(rooms).where(eq(rooms.id, roomId)).limit(1);

        if (!room.length) {
            throw createError({ statusCode: 404, message: 'Ruangan tidak ditemukan' });
        }

        const doorResult = await db.execute(sql`
            SELECT status FROM door_lock_history
            WHERE room_id = ${roomId}
            ORDER BY recorded_at DESC
            LIMIT 1
        `) as { status: string }[];

        return {
            success: true,
            id: room[0]!.id,
            name: room[0]!.name,
            state: doorResult.length > 0 ? doorResult[0]!.status : 'closed',
        };
    }

    const all = await db.select({ id: rooms.id, name: rooms.name })
        .from(rooms).orderBy(rooms.name);

    const doorResult = await db.execute(sql`
        SELECT DISTINCT ON (room_id) room_id, status
        FROM door_lock_history
        ORDER BY room_id, recorded_at DESC
    `) as { room_id: string; status: string }[];

    const doorMap = new Map(doorResult.map(d => [d.room_id, d.status]));

    return {
        success: true,
        data: all.map(r => ({
            id: r.id,
            name: r.name,
            state: doorMap.get(r.id) || 'closed',
        })),
    };
});
