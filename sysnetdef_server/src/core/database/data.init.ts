import { db } from './drizzle';
import { sqliteConnection } from './sqlite';
import { users } from '../../database/schema/user.model';
import { idpsRules } from '../../database/schema/idpsRules.model';
import { systemConfigs } from '../../database/schema/systemConfig.model'; 
import { systemSettings } from '../../database/schema/systemSettings.model';
import { auditLogs } from '../../database/schema/auditLogs.model';

import { userSeeds } from '../../database/seed/user.seed';
import { idpsRuleSeeds } from '../../database/seed/idpsRules.seed';
import { systemConfigSeeds } from '../../database/seed/systemConfig.seed'; 
import { systemSettingsSeeds } from '../../database/seed/systemSettings.seed';
import { auditLogSeeds } from '../../database/seed/auditLogs.seed';

import { eq, sql } from 'drizzle-orm';
import { logger } from '#/shared/utils/logger.utils';

export const initializeData = () => {
  try {
    // 0. Đảm bảo cấu trúc các bảng khớp 100% với Drizzle Schema models (rules, system_status, system_settings, audit_logs)
    sqliteConnection.exec(`
      PRAGMA foreign_keys = OFF;

      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT,
        email TEXT NOT NULL UNIQUE,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        notify TEXT,
        last_login TEXT,
        create_time TEXT DEFAULT (datetime('now', '+7 hours'))
      );

      CREATE TABLE IF NOT EXISTS rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rule_id INTEGER NOT NULL UNIQUE,
        status INTEGER NOT NULL DEFAULT 0,
        description TEXT NOT NULL,
        source_ip TEXT DEFAULT 'Any',
        destination_ip TEXT DEFAULT 'Any',
        source_port TEXT DEFAULT 'Any',
        destination_port TEXT DEFAULT 'Any',
        protocol TEXT NOT NULL,
        action TEXT NOT NULL,
        severity INTEGER NOT NULL,
        created_at TEXT DEFAULT (datetime('now', '+7 hours'))
      );

      CREATE TABLE IF NOT EXISTS system_status (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        description TEXT,
        updated_at TEXT DEFAULT (datetime('now', '+7 hours'))
      );

      CREATE TABLE IF NOT EXISTS system_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        logs_usage_limit INTEGER DEFAULT 80,
        auto_clean_logs INTEGER DEFAULT 1,
        logs_file_rotation INTEGER DEFAULT 1,
        auto_clean_active INTEGER DEFAULT 1,
        clean_active_older_than INTEGER DEFAULT 30
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        username TEXT NOT NULL,
        time TEXT DEFAULT (datetime('now', '+7 hours')),
        action TEXT NOT NULL,
        status TEXT NOT NULL,
        result TEXT
      );

      PRAGMA foreign_keys = ON;
    `);

    // 1. Kiểm tra xem đã có User admin chưa
    const existingAdmin = db.select()
      .from(users)
      .where(eq(users.username, 'admin'))
      .get();

    if (!existingAdmin) {
      logger.info('APP', 'No admin user found. Initializing database schema and seed data...');
      // 2. Chèn User Admin
      db.insert(users).values(userSeeds).run();

      // 3. Chèn dữ liệu IDPS Rules
      db.insert(idpsRules).values(idpsRuleSeeds).run();

      // 4. Bổ sung: Chèn dữ liệu System Config
      const existingConfig = db.select({ count: sql<number>`count(*)` })
        .from(systemConfigs)
        .get();

      if (!existingConfig || existingConfig.count === 0) {
        db.insert(systemConfigs).values(systemConfigSeeds).run();
      }

      // 5. Bổ sung: Chèn dữ liệu System Settings
      const existingSettings = db.select({ count: sql<number>`count(*)` })
        .from(systemSettings)
        .get();

      if (!existingSettings || existingSettings.count === 0) {
        db.insert(systemSettings).values(systemSettingsSeeds).run();
      }

      // 6. Bổ sung: Chèn dữ liệu Audit Logs
      const existingAudit = db.select({ count: sql<number>`count(*)` })
        .from(auditLogs)
        .get();

      if (!existingAudit || existingAudit.count === 0) {
        db.insert(auditLogs).values(auditLogSeeds).run();
      }
      logger.success('APP', 'Database tables and initial seed data created successfully.');
    }
  } catch (error: any) {
    logger.error('APP', `Database initialization error: ${error.message}`);
  }
};