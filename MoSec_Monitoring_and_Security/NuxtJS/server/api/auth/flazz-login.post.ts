import { eq } from 'drizzle-orm';
import { db } from '../../utils/db';
import { users_messier } from '../../utils/schema';

const MESSIER_LOGIN_URL = 'https://bluejack.binus.ac.id/lapi/API/Account/LogOn';

/**
 * The Bluejack LogOn response shape isn't strictly typed here, so pull the
 * bearer token out of the most likely fields. This token is what the
 * PythonServer needs to call the Schedule API when generating the briefing PPT.
 */
function extractToken(result: unknown): string | null {
    if (typeof result === 'string') return result;
    if (result && typeof result === 'object') {
        const r = result as Record<string, unknown>;
        for (const key of ['token', 'Token', 'accessToken', 'access_token', 'AccessToken', 'jwt', 'Jwt']) {
            const v = r[key];
            if (typeof v === 'string' && v.length > 0) return v;
        }
        // Sometimes nested under a user/data object.
        for (const nestedKey of ['data', 'Data', 'user', 'User', 'result', 'Result']) {
            const nested = r[nestedKey];
            if (nested && typeof nested === 'object') {
                const found = extractToken(nested);
                if (found) return found;
            }
        }
    }
    return null;
}

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

    const token = extractToken(messierResult);

    return {
        success: true,
        message: 'Login berhasil via Messier',
        mapped: {
            Flazz_id: flazzId,
            Intial: initial,
            Messier_Password: '********',
        },
        // Bluejack bearer token — forwarded by the desktop to /api/briefing/generate-ppt.
        token,
        messier: messierResult,
    };
});
