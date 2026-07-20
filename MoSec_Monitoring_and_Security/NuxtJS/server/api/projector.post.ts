import { eq, sql } from 'drizzle-orm';
import { db } from '../utils/db';
import { rooms, projector_history } from '../utils/schema';
import { randomUUID } from 'crypto';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const roomRaw = body?.room;
    const luxRaw = body?.nilai_cahaya;

    if (!roomRaw || typeof luxRaw === 'undefined') {
        throw createError({ statusCode: 400, message: 'Payload wajib berisi `room` dan `nilai_cahaya`' });
    }

    const roomName = String(roomRaw);
    if (!roomName) {
        throw createError({ statusCode: 400, message: 'Field `room` wajib diisi' });
    }

    const luxValue = Number(luxRaw);
    if (Number.isNaN(luxValue)) {
        throw createError({ statusCode: 400, message: 'Field `nilai_cahaya` harus berupa angka' });
    }

    const room = await db.select().from(rooms).where(eq(rooms.name, roomName)).limit(1);
    if (room.length === 0) {
        throw createError({ statusCode: 404, message: `Ruangan dengan nama ${roomName} tidak ditemukan` });
    }

    const roomId = room[0]!.id;

    // Determine current projector state from history
    const latestSession = await db.execute(sql`
        SELECT turned_off_at IS NULL AS is_on
        FROM projector_history
        WHERE room_id = ${roomId}
        ORDER BY turned_on_at DESC
        LIMIT 1
    `) as { is_on: boolean }[];

    const projectorIsOn = latestSession.length > 0 && latestSession[0]!.is_on;
    const shouldBeOn = luxValue < 400;

    try {
        if (shouldBeOn && !projectorIsOn) {
            await db.insert(projector_history).values({
                id: randomUUID(),
                room_id: roomId,
                turned_on_at: sql`NOW()`,
                light_sensor_value: luxValue
            });
        } else if (shouldBeOn && projectorIsOn) {
            await db.execute(sql`
                UPDATE projector_history
                SET light_sensor_value = ${luxValue}
                WHERE id = (
                    SELECT id
                    FROM projector_history
                    WHERE room_id = ${roomId}
                        AND turned_off_at IS NULL
                    ORDER BY turned_on_at DESC
                    LIMIT 1
                )
            `);
        } else if (!shouldBeOn && projectorIsOn) {
            await db.execute(sql`
                UPDATE projector_history
                SET turned_off_at = NOW(),
                    light_sensor_value = ${luxValue}
                WHERE id = (
                    SELECT id
                    FROM projector_history
                    WHERE room_id = ${roomId}
                        AND turned_off_at IS NULL
                    ORDER BY turned_on_at DESC
                    LIMIT 1
                )
            `);
        }
    } catch (err) {
        console.error('Gagal menyimpan data proyektor:', err);
        throw createError({ statusCode: 500, message: 'Gagal menyimpan data proyektor' });
    }

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
