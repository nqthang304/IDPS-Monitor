import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from './user.model';

export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  username: text('username').notNull(),
  time: text('time').default(sql`(CURRENT_TIMESTAMP)`),
  action: text('action').notNull(),
  status: text('status').notNull(),
  result: text('result')
});
