import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL tidak ditemukan di .env!');
}

const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client);

export async function testConnection() {
  try {
    await db.execute(sql`SELECT 1`);
    return { success: true, message: 'Database connected' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}