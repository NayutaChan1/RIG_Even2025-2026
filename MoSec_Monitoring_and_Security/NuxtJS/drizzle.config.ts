import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './server/utils/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: "postgresql://postgres:root@db:5432/postgres?sslmode=disable", 
  },
});