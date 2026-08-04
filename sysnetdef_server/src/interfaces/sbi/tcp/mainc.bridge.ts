import { TcpService } from "./mainc.driver";
import { logger } from "#/shared/utils/logger.utils";
import { notificationWS } from "#/interfaces/nbi/ws/notification.ws";
import { IdpsRuleHandlerService } from "#/modules/idps/idpsRules.handler.service";

/**
 * Danh sách các hành động hệ thống
 */
export enum SystemAction {
  IDPS_CONDITION_UPDATE = "IDPS_CONDITION_UPDATE",
  IDPS_RULES_UPDATE = "IDPS_RULES_UPDATE",
}

/**
 * Interface định nghĩa cấu trúc phản hồi từ Bridge
 */
export interface BridgeResponse {
  success: boolean;
  message: string;
  currentAction?: SystemAction | null;
}

export class HardwareBridge {
  private static isProcessing = false;
  private static currentAction: SystemAction | null = null;

  // Đăng ký handler tương ứng với IDPS module
  private static idpsHandler = new IdpsRuleHandlerService();

  /**
   * HÀM ĐIỀU PHỐI HANDLER (Dispatcher)
   * Quyết định xem kết quả từ mainC sẽ được xử lý bởi Service nào
   */
  private static async dispatchToHandler(actionCode: SystemAction, rawResponse: string, payload?: any) {
    switch (actionCode) {
      case SystemAction.IDPS_CONDITION_UPDATE:
      case SystemAction.IDPS_RULES_UPDATE:
        return await this.idpsHandler.handleHardwareResponse(rawResponse);

      default:
        throw new Error(`No handler found for the action: ${actionCode}`);
    }
  }

  /**
   * THỰC THI CẤU HÌNH
   */
  static async executeConfig(actionCode: SystemAction, commandPackage: string, payload?: any): Promise<BridgeResponse> {

    // 1. Kiểm tra Lock
    if (this.isProcessing) {
      logger.warn("HARDWARE_BRIDGE", `Refuse [${actionCode}]: The device is busy processing [${this.currentAction}].`);
      return {
        success: false,
        message: "The system is processing other configurations. Please wait a moment.",
        currentAction: this.currentAction
      };
    }

    // 2. Đánh dấu bận và lưu lại action hiện tại
    this.isProcessing = true;
    this.currentAction = actionCode;

    // 3. Chạy tiến trình ngầm (IIFE)
    (async () => {
      try {
        logger.info("HARDWARE_BRIDGE", `>>> EXECUTE ACTION WITH ID: [${actionCode}]`, 3, 0);

        // Nạp lệnh xuống mainC driver
        const rawResponse = await TcpService.sendCommandToCProgram(commandPackage);

        // Gửi phản hồi sang Handler Service để xử lý Database
        const handlerResult = await this.dispatchToHandler(actionCode, rawResponse, payload);

        // Nếu Handler báo cập nhật DB thành công
        if (handlerResult.success) {
          logger.success("HARDWARE_BRIDGE", `[${actionCode}] DB sync successful.`);

          // Bắn WebSocket thông báo cho Frontend
          notificationWS.notify({
            actionID: actionCode,
            status: 200,
            message: handlerResult.message || `Config [${actionCode}] has been successfully implemented.`
          });
        } else {
          throw new Error(handlerResult.message || "Handler reports an error when updating the database.");
        }

      } catch (error: any) {
        logger.error("HARDWARE_BRIDGE", `Execution error [${actionCode}]: ${error.message}`);

        // Thông báo thất bại qua WebSocket
        notificationWS.notify({
          actionID: actionCode,
          status: 500,
          message: `Device error [${actionCode}]: ${error.message}`
        });
      } finally {
        // Giải phóng Lock và reset action
        this.isProcessing = false;
        this.currentAction = null;
        logger.info("HARDWARE_BRIDGE", `<<< EXECUTION COMPLETED - SYSTEM READY...`, 0, 3);
      }
    })();

    // 4. Trả lời ngay lập tức cho Request Service
    return {
      success: true,
      message: "The command has been received and is being loaded onto the device...",
      currentAction: actionCode
    };
  }

  /**
   * HÀM KIỂM TRA TRẠNG THÁI HỆ THỐNG
   * Trả về thông tin action hiện tại nếu bận, 
   * Trả về null nếu sẵn sàng
   */
  static checkSystemBusy(): BridgeResponse | null {
    if (this.isProcessing) {
      logger.warn("HARDWARE_BRIDGE", `Check status: The device is busy processing. [${this.currentAction}].`);
      return {
        success: false,
        message: "The system is processing other configurations. Please wait a moment.",
        currentAction: this.currentAction
      };
    }
    return null;
  }
}