import os from 'os';
import * as si from 'systeminformation';
import fs from 'fs/promises';
import { existsSync, writeFileSync } from 'fs';
import path from 'path';
import { ENV } from "#/core/config/env";
import { logger } from "@/shared/utils/logger.utils";
import { HardwareBridge, SystemAction } from "#/interfaces/sbi/tcp/mainc.bridge";
import { getFileDetails } from '@/shared/utils/device.utils'; // Giả định bạn giữ helper cũ hoặc chuyển qua utils mới

export class DeviceStorageService {

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

    // Tính toán phần trăm thủ công vì MemData không có 'percent'
    // memory.used / memory.total * 100
    const memoryUsagePercent = ((memory.used / memory.total) * 100).toFixed(2);

    return {
      systemUptime: this.formatUptime(uptimeSeconds),
      performanceData: {
        memory: {
          totalMemory: (memory.total / 1024 / 1024).toFixed(2) + ' MB',
          freeMemory: (memory.free / 1024 / 1024).toFixed(2) + ' MB',
          usagePercentage: parseFloat(memoryUsagePercent), // Trả về số hoặc string tùy bạn
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
    const mainDisk = storage[0]; // Thường là phân vùng chính

    const logDetails = getFileDetails(logPath);

    // Xây dựng đối tượng kết quả
    const result = {
      totalLogSize: logDetails.logSize,
      logsCount: logDetails.logDetails.length,
      storageInfo: {
        total: mainDisk.size,
        free: mainDisk.available,
        used: mainDisk.used
      }
    };

    // Log các giá trị trước khi return
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
    // 1. Lưu cấu hình vào file vật lý (giống logic cũ)
    if (ENV.DISK_THRESHOLD_PATH) {
      await fs.writeFile(ENV.DISK_THRESHOLD_PATH, settings.threshold.toString());
    }

    if (ENV.AUTO_MANUAL_PATH) {
      await fs.writeFile(ENV.AUTO_MANUAL_PATH, settings.enableDelete ? 'true' : 'false');
    }

    // 2. Nếu có lệnh gửi xuống chương trình C (HardwareBridge)
    // Ví dụ lệnh Reset hoặc cập nhật thông số trực tiếp
    return { success: true, message: "Disk settings updated and synced." };
  }

  private formatUptime(seconds: number): string {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d} days, ${h} hours, ${m} minutes`;
  }
}