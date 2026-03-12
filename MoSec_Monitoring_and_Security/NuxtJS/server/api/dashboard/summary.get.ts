import { eq } from 'drizzle-orm';
import { db } from '../../utils/db';
import { rooms } from '../../utils/schema';

export default defineEventHandler(async (event) => {
    // getQueryParams
    const query = getQuery(event);
    const targetRoomId = query.roomId as string;

    // Error handling
    if (!targetRoomId) {
        throw createError({ 
            statusCode: 400, 
            message: 'Parameter roomId wajib dikirim!' 
        });
    }

    // Query
    const room = await db.select().from(rooms).where(eq(rooms.id, targetRoomId)).limit(1);

    if (room.length === 0) {
        throw createError({ 
            statusCode: 404, 
            message: `Ruangan ${targetRoomId} tidak ditemukan di database` 
        });
    }

    // return data
    return {
        success: true,
        data: {
            roomId: room[0]?.id,
            statusProyektor: room[0]?.projector_status ? 'NYALA' : 'MATI',
            statusPintu: room[0]?.status === 'open' ? 'Terbuka' : 'Terkunci',
            uptimeProyektorJam: 24.3, 
            insidenLupaKunci: 3
        }
    };
});