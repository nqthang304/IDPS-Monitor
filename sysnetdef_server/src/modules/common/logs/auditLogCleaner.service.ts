import fs from 'fs';
import path from 'path';
import { SystemSettingsRepository } from "#/database/repository/systemSettings.repository";
import { AuditLogRepository } from "#/database/repository/auditLog.repository";
import { logger } from "@/shared/utils/logger.utils";
import { getStorageInfo } from '@/shared/utils/device.utils';
import { ENV } from '#/core/config/env';

export class AuditLogCleanerService {
  private settingsRepo = new SystemSettingsRepository();
  private auditLogRepo = new AuditLogRepository();
  private timer: NodeJS.Timeout | null = null;

  /**
   * Dọn dẹp Audit Logs dựa trên Activity Settings (số ngày lưu trữ)
   */
  async runAutoCleanJob() {
    try {
      const settings = await this.settingsRepo.getSettings();
      const isAutoCleanEnabled = settings.autoCleanActive ?? true;
      const cleanTimeDays = settings.cleanActiveOlderThan ?? 30;

      if (isAutoCleanEnabled && cleanTimeDays > 0) {
        logger.info("APP", `Running auto-clean for audit logs older than ${cleanTimeDays} days...`);
        const deletedCount = await this.auditLogRepo.deleteOlderThanDays(cleanTimeDays);
        if (deletedCount > 0) {
          logger.success("APP", `Auto-cleaned ${deletedCount} audit logs older than ${cleanTimeDays} days.`);
        } else {
          logger.info("APP", `Auto-clean completed: no audit logs older than ${cleanTimeDays} days found.`);
        }
      }
    } catch (error: any) {
      logger.error("APP", `Audit logs auto-clean job error: ${error?.message}`);
    }
  }

  /**
   * Dọn dẹp File Logs đĩa dựa trên Logs Retention (ngưỡng % dung lượng ổ đĩa)
   */
  async runLogsRetentionCleanJob() {
    try {
      const settings = await this.settingsRepo.getSettings();
      const isAutoCleanEnabled = settings.autoCleanLogs ?? true;
      const usageLimitPercent = settings.logsUsageLimit ?? 80;

      if (!isAutoCleanEnabled) return;

      const storageInfo = await getStorageInfo();
      if (!storageInfo) return;

      if (storageInfo.usedPercentage >= usageLimitPercent) {
        logger.warn("APP", `Disk usage (${storageInfo.usedPercentage}%) reached threshold (${usageLimitPercent}%). Auto-cleaning old log files...`);
        const rootLogsPath = ENV.ROOT_LOGS_PATH || path.join(process.cwd(), "logs");
        if (!fs.existsSync(rootLogsPath)) return;

        const logFiles: { path: string; mtime: number; size: number }[] = [];
        const scanDir = (dir: string) => {
          if (!fs.existsSync(dir)) return;
          const items = fs.readdirSync(dir);
          for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
              scanDir(fullPath);
            } else if (stat.isFile() && item.endsWith('.log')) {
              logFiles.push({ path: fullPath, mtime: stat.mtimeMs, size: stat.size });
            }
          }
        };

        scanDir(rootLogsPath);
        logFiles.sort((a, b) => a.mtime - b.mtime); // Xóa file cũ nhất trước

        let freedBytes = 0;
        let deletedCount = 0;
        for (const file of logFiles) {
          try {
            fs.unlinkSync(file.path);
            deletedCount++;
            freedBytes += file.size;
            const newUsedBytes = storageInfo.used - freedBytes;
            const newPercentage = (newUsedBytes / storageInfo.total) * 100;
            if (newPercentage < usageLimitPercent) break;
          } catch (e) {
            // Đã bị khóa bởi process khác, tiếp tục file khác
          }
        }

        if (deletedCount > 0) {
          logger.success("APP", `Logs retention auto-clean freed ${deletedCount} log files (${(freedBytes / 1024 / 1024).toFixed(2)} MB).`);
        }
      }
    } catch (error: any) {
      logger.error("APP", `Logs retention auto-clean job error: ${error?.message}`);
    }
  }

  startAutoCleanCron(intervalMs = 60 * 60 * 1000) {
    // 1. Chạy ngay khi khởi động server
    this.runAutoCleanJob();
    this.runLogsRetentionCleanJob();

    // 2. Lên lịch chạy định kỳ (mặc định 1 giờ / lần)
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.timer = setInterval(() => {
      this.runAutoCleanJob();
      this.runLogsRetentionCleanJob();
    }, intervalMs);

    logger.success("APP", "Logs auto-clean background job initialized.");
  }
}

export const auditLogCleanerService = new AuditLogCleanerService();
