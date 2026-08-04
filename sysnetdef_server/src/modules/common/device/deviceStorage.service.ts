import * as si from 'systeminformation';
import { ENV } from "#/core/config/env";
import { logger } from "@/shared/utils/logger.utils";
import { getFileDetails } from '@/shared/utils/device.utils';
import { SystemSettingsRepository } from '#/database/repository/systemSettings.repository';
import { auditLogCleanerService } from '#/modules/common/logs/auditLogCleaner.service';

export class DeviceStorageService {
  private settingsRepository = new SystemSettingsRepository();

  /**
   * Lấy thông tin dung lượng đĩa và dung lượng Logs
   */
  async getDiskUsage() {
    const logPath = ENV.ROOT_LOGS_PATH;
    const storage = await si.fsSize();
    const mainDisk = storage[0];

    const logDetails = getFileDetails(logPath);

    const result = {
      totalLogSize: logDetails.logSize,
      logsCount: logDetails.logDetails.length,
      storageInfo: {
        total: mainDisk.size,
        free: mainDisk.available,
        used: mainDisk.used
      }
    };

    logger.info("DEVICE_STORAGE_SERVICE", `Disk Usage Data: ${JSON.stringify(result)}`);

    return result;
  }

  async getLogsRetention() {
    const settings = await this.settingsRepository.getSettings();
    return {
      usageLimit: settings.logsUsageLimit ?? 80,
      autoClean: settings.autoCleanLogs ?? true,
    };
  }

  async updateLogsRetention(payload: { usageLimit?: number; autoClean?: boolean }) {
    const updated = await this.settingsRepository.updateLogsRetention(payload);

    // Kích hoạt ngay kiểm tra dọn dẹp dung lượng đĩa khi cập nhật cài đặt Logs Retention
    auditLogCleanerService.runLogsRetentionCleanJob();

    return {
      usageLimit: updated.logsUsageLimit ?? 80,
      autoClean: updated.autoCleanLogs ?? true,
    };
  }

  async getActivitySettings() {
    const settings = await this.settingsRepository.getSettings();
    return {
      cleanActive: settings.autoCleanActive ?? true,
      cleanTime: settings.cleanActiveOlderThan ?? 30,
    };
  }

  async updateActivitySettings(payload: { cleanActive?: boolean; cleanTime?: number }) {
    const updated = await this.settingsRepository.updateActivitySettings(payload);
    
    // Tự động kích hoạt công việc dọn dẹp audit log cũ ngay khi cấu hình thay đổi
    auditLogCleanerService.runAutoCleanJob();

    return {
      cleanActive: updated.autoCleanActive ?? true,
      cleanTime: updated.cleanActiveOlderThan ?? 30,
    };
  }
}