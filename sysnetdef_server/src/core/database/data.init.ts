import { db } from './drizzle';
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

export const initializeData = async () => {
  try {
    // 1. Kiểm tra xem đã có User admin chưa
    const existingAdmin = db.select()
      .from(users)
      .where(eq(users.username, 'admin'))
      .get();

    if (!existingAdmin) {
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
    }
  } catch (error) {
    // console.error('\x1b[31m[Data Error]\x1b[0m Initialization failed:', error);
  }
};