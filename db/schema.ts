// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const userStates=sqliteTable('minimal_user_states',{
 userId:text('user_id').primaryKey(),
 payload:text('payload'),
 revision:integer('revision').notNull().default(0),
 previousPayload:text('previous_payload'),
 updatedAt:integer('updated_at').notNull().default(0),
});

// One rolling counter per account/operation, plus two global quota guards.
export const apiLimits=sqliteTable('minimal_api_limits',{
 bucket:text('bucket').primaryKey(),
 windowStart:integer('window_start').notNull(),
 hits:integer('hits').notNull(),
});
