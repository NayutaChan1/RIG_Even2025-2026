import { eq } from 'drizzle-orm';
import { db } from '../utils/db';
import { rooms, door_lock_history } from '../utils/schema';
import { randomUUID } from 'crypto';

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { roomId, state } = body

    if (!roomId || !state) {
        throw createError({ statusCode: 400, message: 'Payload wajib berisi `roomId` dan `state`' });
    }

    const doorState = String(state).toLowerCase();
    if (doorState !== 'open' && doorState !== 'closed') {
        throw createError({ statusCode: 400, message: 'Field `state` harus berupa "open" atau "closed"' });
    }

    const roomResult = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
    if (roomResult.length === 0) {
        throw createError({ statusCode: 404, message: `Ruangan dengan id ${roomId} tidak ditemukan` });
    }

    const roomName = roomResult[0]!.name;

    try {
        await db.insert(door_lock_history).values({
            id: randomUUID(),
            room_id: roomId,
            status: doorState,
        });
    } catch (err) {
        console.error('Gagal menyimpan data pintu:', err);
        throw createError({ statusCode: 500, message: 'Gagal menyimpan data pintu' });
    }

    return {
        success: true,
        message: 'Status pintu berhasil diupdate!',
        roomId: roomId,
        roomName: roomName,
        status: doorState
    }
})
