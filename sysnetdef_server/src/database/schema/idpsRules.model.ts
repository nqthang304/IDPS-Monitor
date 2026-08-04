import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const idpsRules = sqliteTable('rules', {
  // ID này là Primary Key của Database, để DB tự quản lý việc định danh bản ghi
  id: integer('id').primaryKey({ autoIncrement: true }),
  // Rule ID từ hệ thống (ví dụ: 1001). 
  // KHÔNG dùng autoIncrement ở đây để kiểm soát bằng logic code.
  ruleId: integer('rule_id').notNull().unique(),
  status: integer('status', { mode: 'boolean' }).notNull().default(false),
  description: text('description').notNull(),
  sourceIp: text('source_ip').default('Any'),
  destinationIp: text('destination_ip').default('Any'),
  sourcePort: text('source_port').default('Any'),
  destinationPort: text('destination_port').default('Any'),
  protocol: text('protocol').notNull(),
  action: text('action').notNull(),
  severity: integer('severity').notNull(),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
});