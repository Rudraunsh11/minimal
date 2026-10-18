// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { integer, sqliteTable, text, primaryKey } from 'drizzle-orm/sqlite-core';
export const userStates=sqliteTable('minimal_user_states',{
 userId:text('user_id').primaryKey(),
 payload:text('payload'),
 revision:integer('revision').notNull().default(0),
 previousPayload:text('previous_payload'),
 restoreToken:text('restore_token'),
 updatedAt:integer('updated_at').notNull().default(0),
});

// One rolling counter per account/operation, plus two global quota guards.
export const apiLimits=sqliteTable('minimal_api_limits',{
 bucket:text('bucket').primaryKey(),
 windowStart:integer('window_start').notNull(),
 hits:integer('hits').notNull(),
});

// At most ten immutable food/water archive chunks per account.
export const archives=sqliteTable('minimal_archives',{
 userId:text('user_id').notNull(),
 archiveId:text('archive_id').notNull(),
 payload:text('payload').notNull(),
 cutoff:text('cutoff').notNull(),
 createdAt:integer('created_at').notNull(),
 byteCount:integer('byte_count').notNull(),
 recordCount:integer('record_count').notNull(),
},table=>[primaryKey({columns:[table.userId,table.archiveId]})]);
