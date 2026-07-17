import { pgTable, text, timestamp, integer, boolean, char, varchar } from 'drizzle-orm/pg-core';

// =========================
// 1. USERS
// =========================
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  flazz: char('flazz', { length: 8 }).unique(),
  hash_pass: varchar('hash_pass', { length: 255 }).notNull(),
  initial: text('initial').notNull().unique(),
  created_at: timestamp('created_at').defaultNow(),
});

// =========================
// 1b. USERS_MESSIER (Flazz card → Messier credentials mapping)
// =========================
export const users_messier = pgTable('users_messier', {
  flazz_id: char('flazz_id', { length: 8 }).primaryKey(),
  initial: text('initial').notNull(),
  messier_password: varchar('messier_password', { length: 255 }).notNull(),
});


// =========================
// 2. ROOMS
// =========================
export const rooms = pgTable('rooms', {
  id: text('id').primaryKey(),
  num: integer('num').notNull(),
  status: text('status').notNull(), 
  projector_status: boolean('projector_status').default(false),
  projector_last_on: timestamp('projector_last_on'),
  projector_last_off: timestamp('projector_last_off'),
});

// =========================
// 3. TRANSACTIONS
// =========================
export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  typed_at: timestamp('typed_at').defaultNow(),
  // Cara Drizzle membuat Foreign Key (ON DELETE CASCADE)
  user_id: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  room_id: text('room_id')
    .notNull()
    .references(() => rooms.id, { onDelete: 'cascade' }),
});

// =========================
// 4. PROJECTOR HISTORY
// =========================
export const projector_history = pgTable('projector_history', {
  id: text('id').primaryKey(),
  room_id: text('room_id')
    .notNull()
    .references(() => rooms.id, { onDelete: 'cascade' }),
  turned_on_at: timestamp('turned_on_at'),
  turned_off_at: timestamp('turned_off_at'),
  light_sensor_value: integer('light_sensor_value'),
  created_at: timestamp('created_at').defaultNow(),
});

// =========================
// 5. ROOM LOCK HISTORY
// =========================
export const room_lock_history = pgTable('room_lock_history', {
  id: text('id').primaryKey(),
  room_id: text('room_id')
    .notNull()
    .references(() => rooms.id, { onDelete: 'cascade' }),
  status: text('status').notNull(),
  recorded_at: timestamp('recorded_at').defaultNow(),
});