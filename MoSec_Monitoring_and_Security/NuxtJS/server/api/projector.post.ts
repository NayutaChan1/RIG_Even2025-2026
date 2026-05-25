import { eq, sql } from 'drizzle-orm';
import { db } from '../utils/db';
import { rooms, projector_history } from '../utils/schema';
import { randomUUID } from 'crypto';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    console.log('Data dari Projector masuk : ', body);

    const roomRaw = body?.room;
    const luxRaw = body?.nilai_cahaya;

    if (!roomRaw || typeof luxRaw === 'undefined') {
        throw createError({ statusCode: 400, message: 'Payload wajib berisi `room` dan `nilai_cahaya`' });
    }

    const roomNum = parseInt(String(roomRaw), 10);
    if (Number.isNaN(roomNum)) {
        throw createError({ statusCode: 400, message: 'Field `room` harus berupa nomor ruangan' });
    }

    const luxValue = Number(luxRaw);
    if (Number.isNaN(luxValue)) {
        throw createError({ statusCode: 400, message: 'Field `nilai_cahaya` harus berupa angka' });
    }

    // Temukan ruangan berdasarkan nomor
    const room = await db.select().from(rooms).where(eq(rooms.num, roomNum)).limit(1);
    if (room.length === 0) {
        throw createError({ statusCode: 404, message: `Ruangan dengan nomor ${roomNum} tidak ditemukan` });
    }

    const roomId = room[0]!.id;
    const projectorIsOn = Boolean(room[0]!.projector_status);
    const shouldBeOn = luxValue < 400;

    try {
        if (shouldBeOn && !projectorIsOn) {
            await db.update(rooms).set({ projector_status: true, projector_last_on: sql`NOW()` }).where(eq(rooms.id, roomId));

            await db.insert(projector_history).values({
                id: randomUUID(),
                room_id: roomId,
                turned_on_at: sql`NOW()`
            });
        } else if (!shouldBeOn && projectorIsOn) {
            await db.execute(sql`
                UPDATE projector_history
                SET turned_off_at = NOW()
                WHERE id = (
                    SELECT id
                    FROM projector_history
                    WHERE room_id = ${roomId}
                        AND turned_off_at IS NULL
                    ORDER BY turned_on_at DESC
                    LIMIT 1
                )
            `);

            await db.update(rooms).set({ projector_status: false, projector_last_off: sql`NOW()` }).where(eq(rooms.id, roomId));
        }
    } catch (err) {
        console.error('Gagal menyimpan data proyektor:', err);
        throw createError({ statusCode: 500, message: 'Gagal menyimpan data proyektor' });
    }

    // Jika ada nilai cahaya, simpan nilai terakhir di storage agar frontend bisa membacanya cepat
    try {
        await useStorage('data').setItem(`projector:${roomId}:last_lux`, JSON.stringify({ value: luxValue, at: new Date().toISOString() }));
    } catch (err) {
        console.warn('Gagal menyimpan nilai_cahaya ke storage:', err);
    }

    return {
        success: true,
        message: 'Status projector berhasil diproses',
        data_received: body,
        stored_lux: luxValue
    };
});