import { eq } from 'drizzle-orm';
import { db } from '../../utils/db';
import { users } from '../../utils/schema';
import bcrypt from 'bcrypt';

export default defineEventHandler(async (event) => {
    const { initial, password } = await readBody(event)

    if(!initial || !password){
        throw createError({
            statusCode: 400,
            message: 'Username dan Password wajib diisi'
        });
    }

    const user = await db.select().from(users).where(eq(users.initial, initial)).limit(1);
    
    if(user.length === 0){
        throw createError({
            statusCode: 401,
            message: 'Intial atau password salah'
        })
    }

    const isPasswordValid = await bcrypt.compare(password, user[0]!.hash_pass);

    if (!isPasswordValid) {
        throw createError({
            statusCode: 401,
            message: 'Initial atau password salah'
        });
    }

    return {
        success: true,
        message: 'Login Berhasil',
        user: {
            id: user[0]!.id,
            name: user[0]!.name,
            initial: user[0]!.initial,
        }
    }
})