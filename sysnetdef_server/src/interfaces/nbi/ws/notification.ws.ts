import { Server, Namespace } from "socket.io";
import { logger } from "@/shared/utils/logger.utils";
// Import SystemAction từ Bridge để làm chuẩn chung
import { SystemAction } from "#/interfaces/sbi/tcp/mainc.bridge";

/**
 * Interface cấu trúc dữ liệu thông báo gửi lên Frontend.
 */
export interface NotificationPayload {
  actionID: SystemAction; // Định danh hành động (Lấy từ Enum trung tâm)
  status: number;       // Mã trạng thái (200: OK, 400+: Error)
  message: string;      // Nội dung thông báo hiển thị lên Toast/Alert
  timestamp?: number;   // Thời gian xảy ra sự kiện
  metadata?: any;       // Các dữ liệu đính kèm nếu cần (ví dụ: ID của rule vừa xóa)
}

class NotificationService {
  private static instance: NotificationService;
  private ns: Namespace | null = null;

  private constructor() {}

  /**
   * Singleton Pattern: Đảm bảo chỉ có một instance duy nhất quản lý thông báo.
   */
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Khởi tạo Namespace Socket.io
   * Được gọi một lần duy nhất tại file app.ts khi khởi động Server.
   */
  public init(io: Server) {
    // Tạo kênh riêng cho thông báo hệ thống
    this.ns = io.of("/system_notification");
    
    this.ns.on("connection", (socket) => {
      logger.info("SYSTEM_NOTIFICATION", `Client admin đã kết nối vào kênh thông báo: ${socket.id}`);
    });

    logger.success("SYSTEM_NOTIFICATION", "Hệ thống thông báo WebSocket đã sẵn sàng.");
  }

  /**
   * Gửi thông báo tới tất cả Client đang kết nối.
   * @param payload Dữ liệu thông báo
   */
  public notify(payload: NotificationPayload) {
    if (!this.ns) {
      logger.error("SYSTEM_NOTIFICATION", "Namespace chưa được khởi tạo. Không thể gửi thông báo!");
      return;
    }

    // Kiểm tra tính hợp lệ của mã hành động (phải nằm trong Enum SystemAction)
    if (!Object.values(SystemAction).includes(payload.actionID)) {
      logger.error("SYSTEM_NOTIFICATION", `Mã hành động không hợp lệ: ${payload.actionID}`);
      return;
    }

    const finalPayload = {
      ...payload,
      timestamp: payload.timestamp || Date.now(),
    };

    /**
     * Phát tín hiệu 'sys_notify' tới toàn bộ các máy khách (Frontend)
     * Frontend cần code: socket.on('sys_notify', (data) => { ... })
     */
    this.ns.emit("sys_notify", finalPayload);
    
    // Log ra terminal để theo dõi
    const logType = payload.status === 200 ? "SUCCESS" : "ERROR";
    logger.info("SYSTEM_NOTIFICATION", `[${logType}] Broadcast: [${payload.actionID}] - ${payload.message}`);
  }
}

// Export duy nhất một instance
export const notificationWS = NotificationService.getInstance();