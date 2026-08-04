import { sqliteTable, integer } from 'drizzle-orm/sqlite-core';

export const systemSettings = sqliteTable('system_settings', {
  id: integer('id').primaryKey().default(1),
  logsUsageLimit: integer('logs_usage_limit').default(80),
  autoCleanLogs: integer('auto_clean_logs', { mode: 'boolean' }).default(true),
  logsFileRotation: integer('logs_file_rotation', { mode: 'boolean' }).default(true),
  autoCleanActive: integer('auto_clean_active', { mode: 'boolean' }).default(true),
  cleanActiveOlderThan: integer('clean_active_older_than').default(30)
});
