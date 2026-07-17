import { eq } from 'drizzle-orm';
import { db } from '../utils/db';
import { rooms, room_lock_history } from '../utils/schema';
import { randomUUID } from 'crypto';

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { room, state } = body

    console.log('Data dari Sensor Pintu masuk:', body)

    if (!room || !state) {
        throw createError({ statusCode: 400, message: 'Payload wajib berisi `room` dan `state`' });
    }

    const roomNum = parseInt(String(room), 10);
    if (Number.isNaN(roomNum)) {
        throw createError({ statusCode: 400, message: 'Field `room` harus berupa nomor ruangan' });
    }

    const doorState = String(state).toLowerCase();
    if (doorState !== 'open' && doorState !== 'closed') {
        throw createError({ statusCode: 400, message: 'Field `state` harus berupa "open" atau "closed"' });
    }

    // get room from room number
    const roomResult = await db.select().from(rooms).where(eq(rooms.num, roomNum)).limit(1);
    if (roomResult.length === 0) {
        throw createError({ statusCode: 404, message: `Ruangan dengan nomor ${roomNum} tidak ditemukan` });
    }

    const roomId = roomResult[0]!.id;

    // update room state and insert lock history
    try {
        await db.update(rooms).set({ status: doorState }).where(eq(rooms.id, roomId));

        await db.insert(room_lock_history).values({
            id: randomUUID(),
            room_id: roomId,
            status: doorState,
        });
    } catch (err) {
        console.error('Gagal menyimpan data pintu:', err);
        throw createError({ statusCode: 500, message: 'Gagal menyimpan data pintu' });
    }

    await useStorage('data').setItems([
        {key: 'room', value: String(room)},
        {key: 'state', value: String(doorState)}
    ]);

    return {
        success: true,
        message: 'Status pintu berhasil diupdate!',
        room: room,
        status: doorState
    }
})