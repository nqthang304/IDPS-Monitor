import { Request, Response } from "express";
import { IdpsRuleRequestService } from "./idpsRules.request.service";
import { logger } from "@/shared/utils/logger.utils";
import { AuditLogger } from "@/shared/utils/auditLogger.utils";
import { emailNotificationService } from "@/shared/services/emailNotification.service";

export class IdpsRuleController {
  private idpsRuleRequestService = new IdpsRuleRequestService();

  /**
   * Helper xử lý lỗi tập trung
   * Trả về 503 nếu hệ thống bận, 400 cho lỗi nghiệp vụ, 500 cho lỗi hệ thống
   */
  private handleError(res: Response, error: any, context: string) {
    logger.error("IDPS_CONTROLLER", `${context}: ${error.message}`);

    // Kiểm tra thông điệp lỗi hoặc flag isBusy từ Service
    const errorMessage = error.message || "";
    const isBusy = error.isBusy ||
      errorMessage.toLowerCase().includes("đang xử lý") ||
      errorMessage.toLowerCase().includes("bận") ||
      errorMessage.toLowerCase().includes("busy");

    if (isBusy) {
      return res.status(503).json({
        success: false,
        message: errorMessage || "The system is currently processing other tasks, please try again later..",
        currentAction: error.currentAction || null // Trả về action đang gây bận (nếu có)
      });
    }

    return res.status(400).json({
      success: false,
      message: errorMessage || "An error occurred while processing the request."
    });
  }

  /**
   * Lấy trạng thái hệ thống IDPS (Active & Mode)
   * GET /idps-rules/system-status
   */
  getIdpsStatus = async (req: Request, res: Response) => {
    try {
      const status = await this.idpsRuleRequestService.getIdpsStatus();

      return res.status(200).json({
        success: true,
        data: status
      });
    } catch (error: any) {
      logger.error("IDPS_CONTROLLER", `Failed to get system status: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: "Unable to retrieve system state."
      });
    }
  };

  /**
   * Cập nhật trạng thái hệ thống IDPS (Active/Mode)
   */
  updateIdpsStatus = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id || 1;
    const username = (req as any).user?.username || 'admin';
    const { active, mode } = req.body;

    try {
      if (typeof active !== "boolean" || !mode) {
        return res.status(400).json({
          success: false,
          message: "The data 'active' (boolean) and 'mode' are required."
        });
      }

      const bridgeResponse = await this.idpsRuleRequestService.updateIdpsSettings(active, mode);

      logger.info("IDPS_CONTROLLER", `State change command (Active: ${active}, Mode: ${mode}) has been sent to the device.`);

      await AuditLogger.logUpdateSystemStatus(userId, username, active, mode, 'SUCCESS');

      emailNotificationService.notifySubscribedUsers(
        "IDPS Mode & Status Updated",
        `User <b>${username}</b> updated IDPS Status to <b>${active ? 'ON' : 'OFF'}</b> and Mode to <b>${mode.toUpperCase()}</b>.`
      );

      return res.status(202).json({
        success: true,
        message: bridgeResponse.message || "The request has been sent to device. Please monitor for system notifications.",
        currentAction: bridgeResponse.currentAction,
        data: {
          requestedStatus: active ? 'ON' : 'OFF',
          requestedMode: mode.toUpperCase()
        }
      });

    } catch (error: any) {
      await AuditLogger.logUpdateSystemStatus(userId, username, active, mode, 'FAILED', error.message);
      return this.handleError(res, error, "IDPS_CONTROLLER_UPDATE_STATUS");
    }
  };

  /**
   * Lấy danh sách rules với filter động
   */
  getRules = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 100;

      const filters = {
        ruleId: req.query.ruleId ? parseInt(req.query.ruleId as string) : undefined,
        description: req.query.description as string,
        sourceIp: req.query.sourceIp as string,
        destinationIp: req.query.destinationIp as string,
        sourcePort: req.query.sourcePort as string,
        destinationPort: req.query.destinationPort as string,
        protocol: req.query.protocol as string,
        action: req.query.action as string,
        severity: req.query.severity ? parseInt(req.query.severity as string) : undefined,
        status: req.query.status !== undefined
          ? req.query.status === 'true' || req.query.status === '1'
          : undefined,
      };

      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined)
      ) as any;

      const result = await this.idpsRuleRequestService.getRules(page, limit, cleanFilters);

      return res.status(200).json({
        success: true,
        data: result.rules,
        pagination: result.pagination
      });
    } catch (error: any) {
      logger.error("IDPS_CONTROLLER", `Failed to fetch rules: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: "Error loading the list of rules."
      });
    }
  };

  /**
   * Thêm mới rule: POST /idps-rules
   */
  create = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id || 1;
    const username = (req as any).user?.username || 'admin';
    try {
      const result = await this.idpsRuleRequestService.createRule(req.body);

      logger.success("IDPS_CONTROLLER", `Rule ${req.body.ruleId} created manually`);

      await AuditLogger.logCreateRule(userId, username, req.body.ruleId, 'SUCCESS');

      return res.status(201).json({
        success: true,
        message: result.message || "New rule added successfully.",
        currentAction: (result as any).currentAction || null,
        data: result
      });
    } catch (error: any) {
      await AuditLogger.logCreateRule(userId, username, req.body?.ruleId || 0, 'FAILED', error.message);
      return this.handleError(res, error, "IDPS_CONTROLLER_CREATE");
    }
  };


  /**
   * Cập nhật rule: PATCH /idps-rules/:ruleId
   */
  update = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id || 1;
    const username = (req as any).user?.username || 'admin';
    const ruleId = parseInt(req.params.ruleId);
    try {
      if (isNaN(ruleId)) {
        throw new Error("Invalid Rule ID.");
      }

      const result = await this.idpsRuleRequestService.updateRule(ruleId, req.body);

      logger.success("IDPS_CONTROLLER", `Rule ${ruleId} updated`);

      await AuditLogger.logUpdateRule(userId, username, ruleId, 'SUCCESS');

      return res.status(200).json({
        success: true,
        message: result.message || "The rule was updated and synchronized successfully.",
        currentAction: result.currentAction
      });
    } catch (error: any) {
      await AuditLogger.logUpdateRule(userId, username, isNaN(ruleId) ? 0 : ruleId, 'FAILED', error.message);
      return this.handleError(res, error, "IDPS_CONTROLLER_UPDATE");
    }
  };

  /**
   * Xóa rule
   */
  remove = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id || 1;
    const username = (req as any).user?.username || 'admin';
    let targetIds: number[] = [];
    try {
      const { ids } = req.body;
      const ruleIdParam = req.params.ruleId;

      if (ids && Array.isArray(ids) && ids.length > 0) {
        targetIds = ids;
        await this.idpsRuleRequestService.deleteRules(ids);
        logger.info("IDPS_CONTROLLER", `Bulk deleted ${ids.length} rules`);
      }
      else if (ruleIdParam) {
        const ruleId = parseInt(ruleIdParam);
        if (isNaN(ruleId)) throw new Error("Invalid Rule ID.");
        targetIds = [ruleId];
        await this.idpsRuleRequestService.deleteRules(ruleId);
        logger.info("IDPS_CONTROLLER", `Deleted rule ${ruleId}`);
      }
      else {
        throw new Error("Please provide the ID(s) to be deleted.");
      }

      await AuditLogger.logDeleteRules(userId, username, targetIds, 'SUCCESS');

      return res.status(200).json({
        success: true,
        message: "Data deletion successful."
      });
    } catch (error: any) {
      await AuditLogger.logDeleteRules(userId, username, targetIds, 'FAILED', error.message);
      return this.handleError(res, error, "IDPS_CONTROLLER_DELETE");
    }
  };

  /**
   * Cập nhật trạng thái hàng loạt
   */
  bulkUpdateStatus = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id || 1;
    const username = (req as any).user?.username || 'admin';
    const { ids, status } = req.body;

    try {
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: "The list of IDs is required and must be an array."
        });
      }

      if (typeof status !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "The status must be either true or false."
        });
      }

      const result = await this.idpsRuleRequestService.bulkUpdateStatus(ids, status);

      logger.success("IDPS_CONTROLLER", `Bulk updated rules to status: ${status}`);

      await AuditLogger.logBulkToggleRuleStatus(userId, username, ids, status, 'SUCCESS');

      return res.status(200).json({
        success: true,
        message: result.message || `The rule status has been updated and the system has been synchronized.`,
        currentAction: result.currentAction,
        data: result
      });
    } catch (error: any) {
      await AuditLogger.logBulkToggleRuleStatus(userId, username, Array.isArray(ids) ? ids : [], Boolean(status), 'FAILED', error.message);
      return this.handleError(res, error, "IDPS_CONTROLLER_BULK_STATUS");
    }
  };

  /**
   * Phân tích dữ liệu traffic từ logs (Dashboard)
   * GET /idps-rules/analyze?start=YYYY-MM-DD HH:mm:ss&end=YYYY-MM-DD HH:mm:ss
   */
  analyzeTraffic = async (req: Request, res: Response) => {
    try {
      const { start, end } = req.query;

      // 1. Validate tham số đầu vào
      if (!start || !end) {
        return res.status(400).json({
          success: false,
          message: "The 'start' and 'end' time parameters (format YYYY-MM-DD HH:mm:ss) are required."
        });
      }

      // Kiểm tra định dạng sơ bộ (Optional nhưng nên có)
      const dateRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
      if (!dateRegex.test(start as string) || !dateRegex.test(end as string)) {
        return res.status(400).json({
          success: false,
          message: "Invalid time format. Please use YYYY-MM-DD HH:mm:ss"
        });
      }

      // 2. Gọi service xử lý logic parse file & thống kê
      const analysisResult = await this.idpsRuleRequestService.analyze(
        start as string,
        end as string
      );

      logger.info("IDPS_CONTROLLER", `Traffic analysis generated for period: ${start} to ${end}`);

      // 3. Trả về kết quả cho Frontend
      return res.status(200).json({
        success: true,
        data: analysisResult
      });

    } catch (error: any) {
      // Sử dụng helper handleError có sẵn của bạn để log và trả lỗi
      return this.handleError(res, error, "IDPS_CONTROLLER_ANALYZE");
    }
  };

  /**
   * Lấy danh sách file log để hiển thị lên bảng
   * GET /idps-rules/log-files?type=normal
   */
  getLogFiles = async (req: Request, res: Response) => {
    try {
      const type = req.query.type as 'normal' | 'drop' | 'alert';
      if (!['normal', 'drop', 'alert'].includes(type)) {
        return res.status(400).json({ success: false, message: "Invalid type" });
      }

      const files = await this.idpsRuleRequestService.getLogFilesByType(type);
      return res.status(200).json({ success: true, data: files });
    } catch (error: any) {
      return this.handleError(res, error, "IDPS_CONTROLLER_GET_FILES");
    }
  };

  /**
   * API Download file log
   * GET /idps-rules/logs/download/:fileId
   */
  downloadLogFile = async (req: Request, res: Response) => {
    try {
      const { fileId } = req.params;

      if (!fileId) {
        return res.status(400).json({
          success: false,
          message: "File ID is required."
        });
      }

      // Gọi service để lấy thông tin file (path và tên file hiển thị)
      const fileInfo = await this.idpsRuleRequestService.getLogFileInfo(fileId);

      if (!fileInfo || !fileInfo.exists) {
        return res.status(404).json({
          success: false,
          message: "The requested log file was not found, or the file has been deleted."
        });
      }

      logger.info("IDPS_CONTROLLER", `User downloading log file: ${fileInfo.fileName}`);

      // Thiết lập header để trình duyệt hiểu đây là file download
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.fileName}"`);

      // Sử dụng phương thức download của Express để truyền file về client
      // Phương thức này tự động xử lý stream và đóng kết nối
      return res.download(fileInfo.filePath, fileInfo.fileName, (err) => {
        if (err) {
          if (res.headersSent) {
            // Nếu header đã gửi đi rồi mà lỗi (đứt kết nối giữa chừng)
            logger.error("IDPS_CONTROLLER", `Error during file streaming: ${err.message}`);
          } else {
            return this.handleError(res, err, "IDPS_CONTROLLER_DOWNLOAD_STREAM");
          }
        }
      });

    } catch (error: any) {
      return this.handleError(res, error, "IDPS_CONTROLLER_DOWNLOAD");
    }
  };
}