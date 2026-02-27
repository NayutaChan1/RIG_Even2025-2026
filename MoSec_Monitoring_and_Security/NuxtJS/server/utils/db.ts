import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = "postgresql://postgres:postgres@localhost:5432/postgres?sslmode=disable"

if (!connectionString) {
  throw new Error('DATABASE_URL tidak ditemukan di .env!');
}

const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client);