import os from 'os';
import * as si from 'systeminformation';
import fs from 'fs/promises';
import { existsSync, writeFileSync } from 'fs';
import path from 'path';
import { ENV } from "#/core/config/env";
import { logger } from "@/shared/utils/logger.utils";
import { HardwareBridge, SystemAction } from "#/interfaces/sbi/tcp/mainc.bridge";
import { getFileDetails } from '@/shared/utils/device.utils';
import { SystemSettingsRepository } from '#/database/repository/systemSettings.repository';

export class DeviceStorageService {
  private settingsRepository = new SystemSettingsRepository();

  /**
   * Thu thập thông tin tài nguyên hệ thống (CPU, RAM, Uptime, Temp)
   */
  async getResourceUsage() {
    const uptimeSeconds = os.uptime();
    const [memory, cpuInfo, cpucores, cpuTemp, cpuLoad] = await Promise.all([
      si.mem(),
      si.cpuCurrentSpeed(),
      Promise.resolve(os.cpus()),
      si.cpuTemperature(),
      si.currentLoad()
    ]);

    const memoryUsagePercent = ((memory.used / memory.total) * 100).toFixed(2);

    return {
      systemUptime: this.formatUptime(uptimeSeconds),
      performanceData: {
        memory: {
          totalMemory: (memory.total / 1024 / 1024).toFixed(2) + ' MB',
          freeMemory: (memory.free / 1024 / 1024).toFixed(2) + ' MB',
          usagePercentage: parseFloat(memoryUsagePercent),
        },
        cpu: {
          cores: cpucores.length,
          speed: cpuInfo.avg + ' GHz',
          overallUsage: `${cpuLoad.currentLoad.toFixed(2)}%`,
          temperature: {
            value: cpuTemp.main || 0,
            unit: "°C"
          }
        }
      }
    };
  }

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

  /**
   * Cập nhật cài đặt đĩa và đồng bộ xuống file hệ thống/phần cứng
   */
  async updateDiskSettings(settings: {
    enableDelete: boolean,
    threshold: number,
    rotation: boolean
  }) {
    if (ENV.DISK_THRESHOLD_PATH) {
      await fs.writeFile(ENV.DISK_THRESHOLD_PATH, settings.threshold.toString());
    }

    if (ENV.AUTO_MANUAL_PATH) {
      await fs.writeFile(ENV.AUTO_MANUAL_PATH, settings.enableDelete ? 'true' : 'false');
    }

    return { success: true, message: "Disk settings updated and synced." };
  }

  async getLogsRetention() {
    const settings = await this.settingsRepository.getSettings();
    return {
      usageLimit: settings.logsUsageLimit ?? 80,
      autoClean: settings.autoCleanLogs ?? true,
      fileRotation: settings.logsFileRotation ?? true,
    };
  }

  async updateLogsRetention(payload: { usageLimit?: number; autoClean?: boolean; fileRotation?: boolean }) {
    const updated = await this.settingsRepository.updateLogsRetention(payload);
    return {
      usageLimit: updated.logsUsageLimit ?? 80,
      autoClean: updated.autoCleanLogs ?? true,
      fileRotation: updated.logsFileRotation ?? true,
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
    return {
      cleanActive: updated.autoCleanActive ?? true,
      cleanTime: updated.cleanActiveOlderThan ?? 30,
    };
  }

  private formatUptime(seconds: number): string {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d} days, ${h} hours, ${m} minutes`;
  }
}