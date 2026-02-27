import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './server/utils/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: "postgresql://postgres:postgres@localhost:5435/postgres?sslmode=disable", 
  },
});