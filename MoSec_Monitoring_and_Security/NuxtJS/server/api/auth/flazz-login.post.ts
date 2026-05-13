import { eq } from 'drizzle-orm';
import { db } from '../../utils/db';
import { users_messier } from '../../utils/schema';

const MESSIER_LOGIN_URL = 'https://bluejack.binus.ac.id/lapi/API/Account/LogOn';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const flazzId: string | undefined = body?.Flazz_id;

    if (!flazzId) {
        throw createError({
            statusCode: 400,
            message: 'Flazz_id wajib diisi',
        });
    }

    if (flazzId.length !== 8) {
        throw createError({
            statusCode: 400,
            message: 'Flazz_id harus 8 karakter',
        });
    }

    const record = await db
        .select()
        .from(users_messier)
        .where(eq(users_messier.flazz_id, flazzId))
        .limit(1);

    if (record.length === 0) {
        throw createError({
            statusCode: 404,
            message: 'Flazz ID tidak terdaftar di database',
        });
    }

    const { initial, messier_password } = record[0]!;

    let messierResponse: Response;
    try {
        messierResponse = await fetch(MESSIER_LOGIN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: initial,
                password: messier_password,
            }),
        });
    } catch (err) {
        throw createError({
            statusCode: 502,
            message: 'Gagal menghubungi Messier API: ' +
                (err instanceof Error ? err.message : 'Unknown error'),
        });
    }

    const messierResult = await messierResponse.json();

    if (!messierResponse.ok) {
        throw createError({
            statusCode: messierResponse.status,
            message: messierResult?.message || 'Messier login gagal',
        });
    }

    return {
        success: true,
        message: 'Login berhasil via Messier',
        mapped: {
            Flazz_id: flazzId,
            Intial: initial,
            Messier_Password: '********',
        },
        messier: messierResult,
    };
});
