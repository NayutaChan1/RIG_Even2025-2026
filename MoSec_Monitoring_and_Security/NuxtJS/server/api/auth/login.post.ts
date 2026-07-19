import { eq } from 'drizzle-orm';
import { db } from '../../utils/db';
import { users } from '../../utils/schema';
import { loginToMessier } from '../../utils/messier';

export default defineEventHandler(async (event) => {
    const { initial, password } = await readBody(event)

    if (!initial || !password) {
        throw createError({
            statusCode: 400,
            message: 'Username dan Password wajib diisi'
        });
    }

    let messierToken: string;
    try {
        const result = await loginToMessier(initial, password);
        messierToken = result.token;
    } catch (err) {
        throw createError({
            statusCode: 401,
            message: err instanceof Error ? err.message : 'Login gagal',
        });
    }

    const user = await db.select().from(users).where(eq(users.initial, initial)).limit(1);

    return {
        success: true,
        message: 'Login Berhasil',
        token: messierToken,
        user: {
            id: user.length > 0 ? user[0]!.id : null,
            name: user.length > 0 ? user[0]!.name : initial,
            initial,
        }
    }
})