import { IdpsRuleRepository } from "#/database/repository/idpsRules.repository";
import { SystemConfigRepository } from "#/database/repository/systemConfig.repository";
import { logger } from "#/shared/utils/logger.utils";

export class IdpsRuleHandlerService {
  private idpsRuleRepository = new IdpsRuleRepository();
  private systemConfigRepository = new SystemConfigRepository();

  async handleHardwareResponse(rawResponse: string) {
    try {
      const response = rawResponse.trim();
      logger.info("IDPS_HANDLER_SERVICE", `Processing hardware response: ${response}`);

      // 1. Kiểm tra lỗi hoặc phản hồi không có OK
      if (response.startsWith("ERROR")) return this.handleError(response);
      if (!response.includes("OK")) {
        return { success: false, message: `Invalid format: ${response}`, event: "IDPS_INVALID_FORMAT" };
      }

      // 2. Tách chuỗi thành mảng các phần tử, loại bỏ phần tử trống và "OK"
      const parts = response.split('$').filter(p => p && p !== "OK");
      
      const updates: Promise<any>[] = [];
      let isRulesReloaded = false;

      // 3. Vòng lặp xử lý từng cặp Key-Value
      // Bước nhảy i += 2 vì cấu trúc là [Key1, Value1, Key2, Value2...]
      for (let i = 0; i < parts.length; i += 2) {
        const key = parts[i];
        const value = parts[i + 1];

        if (!key) continue;

        switch (key) {
          case "IDPS_EN_DIS":
            const status = value === "1" ? "ON" : "OFF";
            updates.push(this.systemConfigRepository.setConfig('IDPS_STATUS', status));
            logger.info("IDPS_HANDLER_SERVICE", `Match: IDPS_STATUS -> ${status}`);
            break;

          case "IDPS_MODE":
            const mode = value.toUpperCase();
            updates.push(this.systemConfigRepository.setConfig('IDPS_MODE', mode));
            logger.info("IDPS_HANDLER_SERVICE", `Match: IDPS_MODE -> ${mode}`);
            break;

          case "IDPS_UPDATE":
            // Lệnh reload file, chỉ đánh dấu để phản hồi, không cần lưu DB
            isRulesReloaded = true;
            logger.info("IDPS_HANDLER_SERVICE", "Match: IDPS_UPDATE (Reload rules applied)");
            break;

          default:
            logger.warn("IDPS_HANDLER_SERVICE", `Unknown key received from hardware: ${key}`);
            break;
        }
      }

      // 4. Thực thi tất cả các cập nhật DB cùng lúc
      if (updates.length > 0) {
        await Promise.all(updates);
      }

      // 5. Trả về kết quả tổng hợp
      return {
        success: true,
        message: isRulesReloaded 
          ? "Đã đồng bộ cấu hình và nạp lại luật thành công." 
          : "Cấu hình IDPS đã được cập nhật thành công.",
        event: isRulesReloaded ? "IDPS_RULES_RELOADED" : "IDPS_SYNC_SUCCESS",
        data: { raw: response }
      };

    } catch (error: any) {
      logger.error("IDPS_HANDLER_SERVICE", `Critical error: ${error.message}`);
      return { success: false, message: "Lỗi xử lý phản hồi phần cứng.", event: "IDPS_HANDLER_CRASH" };
    }
  }

  private handleError(response: string) {
    logger.error("IDPS_HANDLER_SERVICE", `Hardware error: ${response}`);
    return { success: false, message: `Thiết bị báo lỗi: ${response}`, event: "IDPS_SYNC_ERROR" };
  }
}