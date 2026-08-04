import { IdpsRuleRepository } from "#/database/repository/idpsRules.repository"
import { SystemConfigRepository } from "#/database/repository/systemConfig.repository";
import { idpsRules } from "#/database/schema/idpsRules.model";
import { ENV } from "#/core/config/env";
import path from "path";
import fs from "fs/promises";
import { HardwareBridge, SystemAction, BridgeResponse } from "#/interfaces/sbi/tcp/mainc.bridge";
import { logger } from "#/shared/utils/logger.utils";
import { readdir, stat } from "fs/promises";
import { createReadStream } from "fs"; // Sử dụng fs thường cho Stream
import { existsSync } from "fs";
import { createInterface } from "readline";

// Định nghĩa Interface cho Filter để đồng bộ với Repo
interface IRuleFilters {
  ruleId?: number;
  description?: string;
  sourceIp?: string;
  destinationIp?: string;
  sourcePort?: string;
  destinationPort?: string;
  protocol?: string;
  action?: string;
  severity?: number;
  status?: boolean;
}

interface ActionStats {
  totalBytes: number;
  avgBitrate: number;
  peakBitrate: number;
}

interface TrafficDataPoint {
  timestamp: number;
  normal: number;
  alert: number;
  drop: number;
}

interface IPTimeSeriesPoint {
  timestamp: number;
  bits: number;
}

interface TopIPEntry {
  ipAddress: string;
  bits: number;
  packets: number;
  history: IPTimeSeriesPoint[];
}

interface ProtocolStats {
  tcp: number;
  udp: number;
  icmp: number;
  others?: number;
}

interface AnalyzeTrafficResponse {
  totalProcessedBytes: number;
  avgProcessedBitrate: number;
  peakProcessedBitrate: number;
  timeSeriesData: TrafficDataPoint[];
  stats: {
    normal: ActionStats;
    drop: ActionStats;
    alert: ActionStats;
  };
  topSourceIps: TopIPEntry[];
  topDestinationIps: TopIPEntry[];
  protocolBreakdown: ProtocolStats;
}

export class IdpsRuleRequestService {
  private idpsRuleRepository = new IdpsRuleRepository();
  private systemConfigRepository = new SystemConfigRepository();

  /**
   * Helper để ném lỗi mang theo thông tin action hiện tại
   * Giúp Controller bắt được và trả về cho Frontend
   */
  private throwBusyError(busy: BridgeResponse) {
    const error: any = new Error(busy.message);
    error.success = busy.success;
    error.currentAction = busy.currentAction;
    error.isBusy = true; // Flag để nhận diện lỗi do hệ thống bận
    throw error;
  }

  /**
   * Lấy trạng thái hoạt động của IDPS
   */
  async getIdpsStatus() {
    // Lấy nhiều config cùng lúc để tối ưu performance
    const configs = await this.systemConfigRepository.getMultipleConfigs(['IDPS_STATUS', 'IDPS_MODE']);

    // Tìm giá trị trong mảng kết quả
    const statusConfig = configs.find(c => c.key === 'IDPS_STATUS');
    const modeConfig = configs.find(c => c.key === 'IDPS_MODE');

    return {
      // Chuyển đổi 'ON'/'OFF' back về boolean true/false cho Frontend dễ dùng
      active: statusConfig ? statusConfig.value === 'ON' : false,
      mode: modeConfig ? modeConfig.value.toLowerCase() : 'ids'
    };
  }

  /**
   * Cập nhật cấu hình IDPS (Active và Mode)
   * Thay vì cập nhật DB trực tiếp, hàm này đóng gói lệnh và gửi qua HardwareBridge
   */
  async updateIdpsSettings(active: boolean, mode: string): Promise<BridgeResponse> {
    // 1. Chuẩn bị dữ liệu cho chuỗi lệnh
    const statusValue = active ? "1" : "0";
    const modeValue = mode.toUpperCase(); // IDS hoặc IPS

    // 2. Xây dựng chuỗi lệnh theo quy tắc:
    // Cặp lệnh 1: IDPS_EN_DIS$Value
    // Cặp lệnh 2: IDPS_MODE$Value (Chỉ có nếu status là ON)
    let commandPackage = `IDPS_EN_DIS$${statusValue}`;

    if (active) {
      commandPackage += `$IDPS_MODE$${modeValue}`;
    }

    // 3. Nạp xuống HardwareBridge
    const result = await HardwareBridge.executeConfig(
      SystemAction.IDPS_CONDITION_UPDATE,
      commandPackage
    );

    if (!result.success) {
      this.throwBusyError(result);
    }

    return result;
  }

  /**
   * Lấy danh sách rules có phân trang linh hoạt
   */
  async getRules(page: number = 1, limit: number = 100, filters: IRuleFilters) {
    // Gọi repo với tham số limit động
    const result = await this.idpsRuleRepository.getRulesWithPagination(page, limit, filters);

    return {
      rules: result.data,
      pagination: {
        ...result.pagination,
      }
    };
  }

  /**
   * Thêm mới 1 rule
   */
  async createRule(data: typeof idpsRules.$inferInsert) {
    const busy = HardwareBridge.checkSystemBusy();
    if (busy) this.throwBusyError(busy);

    try {
      // 1. Thực hiện tạo rule trong Database
      const newRule = await this.idpsRuleRepository.createRule(data);

      // 2. Kiểm tra nếu status là true thì đồng bộ ra file và nạp xuống phần cứng
      if (data.status === true) {
        logger.info("IDPS_SERVICE", `Rule ${data.ruleId} created with Active status. Syncing to file...`);
        return await this.exportRulesToFiles();
      }

      return {
        success: true,
        message: "The rule has been successfully created (off state).",
        data: newRule
      };
    } catch (error: any) {
      if (error.isBusy) throw error;
      if (error.message.includes("UNIQUE constraint failed")) {
        throw new Error(`Rule ID ${data.ruleId} already existed in the system.`);
      }
      logger.error("IDPS_SERVICE", `Failed to create rule: ${error.message}`);
      throw error;
    }
  }


  /**
   * Cập nhật thông tin rule
   */
  async updateRule(ruleId: number, data: Partial<typeof idpsRules.$inferInsert>) {
    const busy = HardwareBridge.checkSystemBusy();
    if (busy) this.throwBusyError(busy);

    if (data.ruleId && data.ruleId !== ruleId) {
      throw new Error("You are not allowed to change the original Rule ID.");
    }

    await this.idpsRuleRepository.updateRule(ruleId, data);
    return await this.exportRulesToFiles();
  }

  /**
   * Xử lý xóa rules
   */
  async deleteRules(ids: number | number[]) {
    const busy = HardwareBridge.checkSystemBusy();
    if (busy) this.throwBusyError(busy);

    const idArray = Array.isArray(ids) ? ids : [ids];

    if (idArray.length === 0) {
      throw new Error("The list of IDs to be deleted is empty.");
    }

    // Kiểm tra xem có rule nào trong danh sách đang Active không
    const checkActive = await this.idpsRuleRepository.getRulesWithPagination(1, 9999, {
      status: true
    });

    const activeRulesInDeleteList = checkActive.data.filter(rule => idArray.includes(rule.id));

    if (activeRulesInDeleteList.length > 0) {
      const sids = activeRulesInDeleteList.map(r => r.ruleId).join(', ');
      throw new Error(
        `Cannot delete active rules! Please disable the following Rule SIDs before deleting: ${sids}`
      );
    }

    if (Array.isArray(ids)) {
      return await this.idpsRuleRepository.bulkDeleteByRuleIds(ids);
    }
    return await this.idpsRuleRepository.deleteByRuleId(ids);
  }

  /**
   * Xuất toàn bộ rule đang Active ra file và bắn lệnh xuống Hardware
   */
  // async exportActiveRulesToFile(): Promise<BridgeResponse & { count?: number, path?: string }> {
  //   try {
  //     const ruleDir = ENV.IDPS_RULE_PATH;
  //     const filePath = path.join(ruleDir, "default.rules");

  //     await fs.mkdir(ruleDir, { recursive: true });

  //     try {
  //       await fs.unlink(filePath);
  //     } catch (err) {
  //       // Bỏ qua lỗi file không tồn tại
  //     }

  //     const activeRulesData = await this.idpsRuleRepository.getRulesWithPagination(1, 999999, {
  //       status: true,
  //     });

  //     const rules = activeRulesData.data;

  //     let fileContent = "";
  //     if (rules.length === 0) {
  //       fileContent = "# No active rules found in database\n";
  //     } else {
  //       fileContent = rules
  //         .map((rule) => {
  //           return `${rule.action} ${rule.protocol.toLowerCase()} ${rule.sourceIp} ${rule.sourcePort} -> ${rule.destinationIp} ${rule.destinationPort} (msg:"${rule.description}"; sid:${rule.ruleId}; rev:1;)`;
  //         })
  //         .join("\n") + "\n";
  //     }

  //     await fs.writeFile(filePath, fileContent);
  //     logger.info("IDPS_SERVICE", `Rules exported to ${filePath}. Count: ${rules.length}`);

  //     // Bắn lệnh thông báo cho Hardware
  //     const hwResult = await HardwareBridge.executeConfig(
  //       SystemAction.IDPS_RULES_UPDATE,
  //       "IDPS_UPDATE$1"
  //     );

  //     return {
  //       ...hwResult,
  //       count: rules.length,
  //       path: filePath
  //     };
  //   } catch (error: any) {
  //     if (error.isBusy) throw error;
  //     logger.error("IDPS_SERVICE", `Failure to export file or sync hardware: ${error.message}`);
  //     throw new Error(`Failed to export rules file: ${error.message}`);
  //   }
  // }

  async exportRulesToFiles(): Promise<BridgeResponse & { activeCount?: number, inactiveCount?: number, path?: string }> {
    try {
      const ruleDir = ENV.IDPS_RULE_PATH;
      const activeFilePath = path.join(ruleDir, "default.rules");
      const inactiveFilePath = path.join(ruleDir, "inactive.rules");

      // Tạo thư mục nếu chưa tồn tại
      await fs.mkdir(ruleDir, { recursive: true });

      // Xóa các file cũ nếu tồn tại
      await Promise.all([
        fs.unlink(activeFilePath).catch(() => {}),
        fs.unlink(inactiveFilePath).catch(() => {})
      ]);

      // Lấy toàn bộ rules từ Database (không dùng filter status để lấy cả active lẫn inactive)
      const allRulesData = await this.idpsRuleRepository.getRulesWithPagination(1, 999999, {});
      const allRules = allRulesData.data;

      // Phân loại rules dựa trên status
      const activeRules = allRules.filter(rule => rule.status === true);
      const inactiveRules = allRules.filter(rule => rule.status !== true);

      // Helper function để build nội dung file theo format rules tiêu chuẩn
      const buildFileContent = (rulesArray: typeof allRules, isDefaultEmptyActive: boolean) => {
        if (rulesArray.length === 0) {
          return isDefaultEmptyActive 
            ? "# No active rules found in database\n" 
            : "# No inactive rules found in database\n";
        }
        return rulesArray
          .map((rule) => {
            return `${rule.action} ${rule.protocol.toLowerCase()} ${rule.sourceIp} ${rule.sourcePort} -> ${rule.destinationIp} ${rule.destinationPort} (msg:"${rule.description}"; sid:${rule.ruleId}; rev:1;)`;
          })
          .join("\n") + "\n";
      };

      const activeContent = buildFileContent(activeRules, true);
      const inactiveContent = buildFileContent(inactiveRules, false);

      // Ghi song song cả 2 file để tối ưu hiệu năng I/O
      await Promise.all([
        fs.writeFile(activeFilePath, activeContent),
        fs.writeFile(inactiveFilePath, inactiveContent)
      ]);

      logger.info("IDPS_SERVICE", `Rules exported. Active: ${activeRules.length} (to ${activeFilePath}), Inactive: ${inactiveRules.length} (to ${inactiveFilePath})`);

      // Bắn lệnh thông báo cho Hardware nạp lại các rules đang kích hoạt
      const hwResult = await HardwareBridge.executeConfig(
        SystemAction.IDPS_RULES_UPDATE,
        "IDPS_UPDATE$1"
      );

      return {
        ...hwResult,
        activeCount: activeRules.length,
        inactiveCount: inactiveRules.length,
        path: activeFilePath // Trả về đường dẫn chính để không làm gãy cấu trúc response cũ nếu có dùng ở controller
      };
    } catch (error: any) {
      if (error.isBusy) throw error;
      logger.error("IDPS_SERVICE", `Failure to export files or sync hardware: ${error.message}`);
      throw new Error(`Failed to export rules files: ${error.message}`);
    }
  }

  /**
   * Cập nhật trạng thái hàng loạt và đồng bộ
   */
  async bulkUpdateStatus(ids: number[], status: boolean) {
    const busy = HardwareBridge.checkSystemBusy();
    if (busy) this.throwBusyError(busy);

    try {
      if (!ids || ids.length === 0) {
        throw new Error("The list of IDs cannot be empty.");
      }

      // 1. Cập nhật hàng loạt trong Database 
      await this.idpsRuleRepository.bulkUpdateStatus(ids, status);

      // 2. Đồng bộ ra file và báo phần cứng nạp lại
      return await this.exportRulesToFiles();
    } catch (error: any) {
      if (error.isBusy) throw error;
      logger.error("IDPS_SERVICE", `Bulk update status failed: ${error.message}`);
      throw error;
    }
  }


  /**
   * 
   * 
   * 
   */


  /**
   * Phân tích dữ liệu log IDPS trong khoảng thời gian nhất định
   * @param start Định dạng YYYY-MM-DD HH:mm:ss
   * @param end Định dạng YYYY-MM-DD HH:mm:ss
   */
  async analyze(start: string, end: string): Promise<AnalyzeTrafficResponse> {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const logDir = ENV.IDPS_LOGS_PATH;

    const sourceMap = new Map<string, { bits: number; packets: number; history: Map<number, number> }>();
    const destMap = new Map<string, { bits: number; packets: number; history: Map<number, number> }>();
    const timeSeriesMap = new Map<number, TrafficDataPoint>();

    const protocolCounts: ProtocolStats = { tcp: 0, udp: 0, icmp: 0, others: 0 };
    const statsDetail = {
      normal: { totalBytes: 0 },
      drop: { totalBytes: 0 },
      alert: { totalBytes: 0 }
    };

    // Biến để xác định khoảng thời gian thực tế có dữ liệu
    let firstLogTime = Infinity;
    let lastLogTime = -Infinity;

    // 1. Lấy danh sách file
    const allFiles = await this.getAllFiles(logDir);

    for (const file of allFiles) {
      if (!file.endsWith('.log')) continue;

      // Sử dụng Readline Interface để tối ưu bộ nhớ
      const fileStream = createReadStream(file);
      const rl = createInterface({ input: fileStream, crlfDelay: Infinity });

      for await (const line of rl) {
        if (!line.trim()) continue;

        const [timeStr, srcIp, dstIp, , , action, , , protocol, pkts, bytes] = line.split('|');
        const entryTime = new Date(timeStr).getTime();

        if (entryTime >= startTime && entryTime <= endTime) {
          // Cập nhật biên thời gian thực tế
          if (entryTime < firstLogTime) firstLogTime = entryTime;
          if (entryTime > lastLogTime) lastLogTime = entryTime;

          const byteVal = parseInt(bytes) || 0;
          const bitVal = byteVal * 8;
          const pktVal = parseInt(pkts) || 0;
          const actKey = action.toLowerCase() as 'normal' | 'drop' | 'alert';
          const protoKey = protocol.toLowerCase();

          // Group theo block 1 phút (60000ms)
          const intervalMs = 60000;
          const timeBucket = Math.floor(entryTime / intervalMs) * intervalMs;

          // Protocol Breakdown
          if (protoKey === 'tcp') protocolCounts.tcp += bitVal;
          else if (protoKey === 'udp') protocolCounts.udp += bitVal;
          else if (protoKey === 'icmp') protocolCounts.icmp += bitVal;
          else protocolCounts.others = (protocolCounts.others || 0) + bitVal;

          // Stats Detail
          if (statsDetail[actKey]) {
            statsDetail[actKey].totalBytes += byteVal;
          }

          // TimeSeries
          if (!timeSeriesMap.has(timeBucket)) {
            timeSeriesMap.set(timeBucket, { timestamp: timeBucket, normal: 0, alert: 0, drop: 0 });
          }
          const tsPoint = timeSeriesMap.get(timeBucket)!;
          if (actKey in tsPoint) {
            (tsPoint as any)[actKey] += bitVal;
          }

          // Top IPs
          this.updateIpMap(sourceMap, srcIp, bitVal, pktVal, timeBucket);
          this.updateIpMap(destMap, dstIp, bitVal, pktVal, timeBucket);
        }
      }
    }

    // 2. Tính toán kết quả
    const timeSeriesData = Array.from(timeSeriesMap.values()).sort((a, b) => a.timestamp - b.timestamp);

    // Tính duration dựa trên log thực tế hoặc fallback về tham số nếu log quá ít
    const actualDurationSeconds = (lastLogTime > firstLogTime)
      ? (lastLogTime - firstLogTime) / 1000
      : (endTime - startTime) / 1000 || 1;

    const totalNormalBytes = statsDetail.normal.totalBytes;
    const totalDropBytes = statsDetail.drop.totalBytes;
    const totalAlertBytes = statsDetail.alert.totalBytes;
    const totalAllBytes = totalNormalBytes + totalDropBytes + totalAlertBytes;

    return {
      totalProcessedBytes: totalAllBytes,
      avgProcessedBitrate: Number(((totalAllBytes * 8) / actualDurationSeconds).toFixed(2)),
      peakProcessedBitrate: Math.max(...timeSeriesData.map(d => d.normal + d.alert + d.drop), 0),

      timeSeriesData,

      stats: {
        normal: this.calculateActionStats(totalNormalBytes, timeSeriesData, 'normal', actualDurationSeconds),
        drop: this.calculateActionStats(totalDropBytes, timeSeriesData, 'drop', actualDurationSeconds),
        alert: this.calculateActionStats(totalAlertBytes, timeSeriesData, 'alert', actualDurationSeconds),
      },

      topSourceIps: this.formatTopIps(sourceMap),
      topDestinationIps: this.formatTopIps(destMap),
      protocolBreakdown: protocolCounts
    };
  }

  /**
   * Đọc file đệ quy
   */
  private async getAllFiles(dirPath: string): Promise<string[]> {
    const files = await readdir(dirPath);
    const arrayOfFiles: string[] = [];

    for (const file of files) {
      const absolutePath = path.join(dirPath, file);
      if ((await stat(absolutePath)).isDirectory()) {
        const subFiles = await this.getAllFiles(absolutePath);
        arrayOfFiles.push(...subFiles);
      } else {
        arrayOfFiles.push(absolutePath);
      }
    }
    return arrayOfFiles;
  }

  /**
   * Helper cập nhật Map IP
   */
  private updateIpMap(map: Map<string, any>, ip: string, bits: number, pkts: number, timeBucket: number) {
    if (!map.has(ip)) {
      map.set(ip, { bits: 0, packets: 0, history: new Map<number, number>() });
    }
    const data = map.get(ip)!;
    data.bits += bits;
    data.packets += pkts;
    data.history.set(timeBucket, (data.history.get(timeBucket) || 0) + bits);
  }

  /**
   * Helper format và sort Top IP
   */
  private formatTopIps(map: Map<string, { bits: number; packets: number; history: Map<number, number> }>): TopIPEntry[] {
    return Array.from(map.entries())
      .map(([ip, data]) => ({
        ipAddress: ip,
        bits: data.bits,
        packets: data.packets,
        history: Array.from(data.history.entries())
          .map(([ts, b]: [number, number]) => ({ // Chỉ định kiểu [number, number] ở đây
            timestamp: ts,
            bits: b
          }))
          .sort((a, b) => a.timestamp - b.timestamp)
      }))
      .sort((a, b) => b.bits - a.bits)
      .slice(0, 10);
  }

  /**
   * Helper tính toán ActionStats
   */
  private calculateActionStats(bytes: number, tsData: TrafficDataPoint[], key: 'normal' | 'drop' | 'alert', duration: number): ActionStats {
    const totalBits = bytes * 8;
    return {
      totalBytes: bytes,
      avgBitrate: Number((totalBits / duration).toFixed(2)),
      peakBitrate: Math.max(...tsData.map(d => d[key]), 0)
    };
  }

  /**
 * Lấy danh sách các file log trong thư mục idps_[type]
 * Đã bổ sung trường from và to bằng cách đọc nội dung file
 */
  async getLogFilesByType(type: 'normal' | 'drop' | 'alert') {
    const logBaseDir = ENV.IDPS_LOGS_PATH;
    const targetDir = path.join(logBaseDir, `idps_${type}`);

    try {
      if (!existsSync(targetDir)) return [];

      const allFilePaths = await this.getAllFiles(targetDir);

      const fileList = await Promise.all(
        allFilePaths
          .filter(filePath => filePath.endsWith('.log'))
          .map(async (filePath) => {
            const fileStat = await fs.stat(filePath);

            // Đọc mốc thời gian từ nội dung file
            const timeBounds = await this.getFileTimeBounds(filePath);

            return {
              fileName: path.basename(filePath),
              size: fileStat.size,
              modifiedAt: fileStat.mtime,
              fileId: Buffer.from(filePath).toString('base64'),
              from: timeBounds.from, // Mốc thời gian bắt đầu (dòng log đầu)
              to: timeBounds.to     // Mốc thời gian kết thúc (dòng log cuối)
            };
          })
      );

      return fileList.sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());
    } catch (error) {
      logger.error("IDPS_SERVICE", `Error listing log files: ${error}`);
      return [];
    }
  }

  /**
   * Giải mã fileId để lấy đường dẫn thực tế
   */
  getFilePathFromId(fileId: string): string {
    const filePath = Buffer.from(fileId, 'base64').toString('utf-8');
    if (existsSync(filePath)) return filePath;
    throw new Error("The file does not exist on the system.");
  }

  /**
   * Lấy thông tin chi tiết file log dựa trên fileId (base64 path)
   * Phục vụ cho chức năng download ở Controller
   */
  async getLogFileInfo(fileId: string) {
    try {
      // 1. Giải mã fileId để lấy đường dẫn thực tế
      const filePath = Buffer.from(fileId, 'base64').toString('utf-8');

      // 2. Kiểm tra tính hợp lệ của đường dẫn (Security Check)
      // Đảm bảo file nằm trong thư mục log được phép, tránh lỗi Path Traversal
      const logBaseDir = path.resolve(ENV.IDPS_LOGS_PATH);
      const absoluteFilePath = path.resolve(filePath);

      if (!absoluteFilePath.startsWith(logBaseDir)) {
        logger.error("IDPS_SERVICE", `Warning: File access request outside the log area: ${absoluteFilePath}`);
        throw new Error("Access denied: The file is not in the log directory.");
      }

      // 3. Kiểm tra file có tồn tại không
      if (!existsSync(absoluteFilePath)) {
        return { exists: false, filePath: "", fileName: "" };
      }

      // 4. Lấy tên file gốc
      const fileName = path.basename(absoluteFilePath);

      return {
        exists: true,
        filePath: absoluteFilePath,
        fileName: fileName
      };
    } catch (error: any) {
      logger.error("IDPS_SERVICE", `Error retrieving download file information: ${error.message}`);
      throw error;
    }
  }

  /**
 * Helper để lấy dòng đầu và dòng cuối của một file mà không đọc hết file
 */
  private async getFileTimeBounds(filePath: string): Promise<{ from: string | null; to: string | null }> {
    try {
      const fileHandle = await fs.open(filePath, 'r');
      const { size } = await fileHandle.stat();

      if (size === 0) {
        await fileHandle.close();
        return { from: null, to: null };
      }

      // 1. Đọc dòng đầu tiên
      const firstBuf = Buffer.alloc(1024); // Đọc 1KB đầu là đủ chứa 1 dòng log
      await fileHandle.read(firstBuf, 0, 1024, 0);
      const firstLine = firstBuf.toString().split('\n')[0];
      const fromTime = firstLine.split('|')[0] || null;

      // 2. Đọc dòng cuối cùng (đọc 1KB cuối file)
      const readSize = Math.min(size, 1024);
      const lastBuf = Buffer.alloc(readSize);
      await fileHandle.read(lastBuf, 0, readSize, size - readSize);
      const lastLines = lastBuf.toString().trim().split('\n');
      const lastLine = lastLines[lastLines.length - 1];
      const toTime = lastLine.split('|')[0] || null;

      await fileHandle.close();
      return { from: fromTime, to: toTime };
    } catch (error) {
      return { from: null, to: null };
    }
  }
}