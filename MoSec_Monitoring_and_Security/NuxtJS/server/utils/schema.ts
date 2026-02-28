import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  flazz: text('flazz').unique(),
  hash_pass: text('hash_pass').notNull(),
  initial: text('initial').notNull().unique(),
  created_at: timestamp('created_at').defaultNow(),
});