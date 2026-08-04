import { db } from "#/core/database/drizzle";
import { systemSettings } from "#/database/schema/systemSettings.model";
import { eq } from "drizzle-orm";

export class SystemSettingsRepository {
  async getSettings() {
    let settings = await db.select().from(systemSettings).where(eq(systemSettings.id, 1)).get();
    if (!settings) {
      await db.insert(systemSettings).values({
        id: 1,
        logsUsageLimit: 80,
        autoCleanLogs: true,
        autoCleanActive: true,
        cleanActiveOlderThan: 30,
      }).run();
      settings = await db.select().from(systemSettings).where(eq(systemSettings.id, 1)).get();
    }
    return settings!;
  }

  async updateLogsRetention(payload: { usageLimit?: number; autoClean?: boolean }) {
    await this.getSettings(); // Ensures record exists
    const updateData: Partial<typeof systemSettings.$inferInsert> = {};
    if (payload.usageLimit !== undefined) updateData.logsUsageLimit = payload.usageLimit;
    if (payload.autoClean !== undefined) updateData.autoCleanLogs = payload.autoClean;

    await db.update(systemSettings).set(updateData).where(eq(systemSettings.id, 1)).run();
    return this.getSettings();
  }

  async updateActivitySettings(payload: { cleanActive?: boolean; cleanTime?: number }) {
    await this.getSettings(); // Ensures record exists
    const updateData: Partial<typeof systemSettings.$inferInsert> = {};
    if (payload.cleanActive !== undefined) updateData.autoCleanActive = payload.cleanActive;
    if (payload.cleanTime !== undefined) updateData.cleanActiveOlderThan = payload.cleanTime;

    await db.update(systemSettings).set(updateData).where(eq(systemSettings.id, 1)).run();
    return this.getSettings();
  }
}
