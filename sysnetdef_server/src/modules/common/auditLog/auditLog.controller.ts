import { Request, Response } from "express";
import { AuditLogRepository } from "#/database/repository/auditLog.repository";
import { logger } from "#/shared/utils/logger.utils";

export class AuditLogController {
  private auditLogRepo = new AuditLogRepository();

  getLogs = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const logs = await this.auditLogRepo.getAll(limit, offset);
      const total = await this.auditLogRepo.count();

      return res.status(200).json({
        success: true,
        data: logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      logger.error("AUDIT_LOG", `Failed to fetch audit logs: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: "Unable to retrieve audit logs.",
      });
    }
  };

  deleteByIds = async (req: Request, res: Response) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: "List of IDs is required." });
      }
      const numericIds = ids.map((id) => Number(id)).filter((id) => !isNaN(id));
      await this.auditLogRepo.deleteByIds(numericIds);
      logger.success("AUDIT_LOG", `Deleted ${numericIds.length} audit logs by IDs`);
      return res.status(200).json({ success: true, message: "Audit logs deleted successfully." });
    } catch (error: any) {
      logger.error("AUDIT_LOG", `Delete audit logs by IDs failed: ${error.message}`);
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  deleteByTimeRange = async (req: Request, res: Response) => {
    try {
      const { from, to } = req.body;
      if (!from || !to) {
        return res.status(400).json({ success: false, message: "Time range (from, to) is required." });
      }
      await this.auditLogRepo.deleteByTimeRange(from, to);
      logger.success("AUDIT_LOG", `Deleted audit logs between ${from} and ${to}`);
      return res.status(200).json({ success: true, message: "Audit logs deleted by time range successfully." });
    } catch (error: any) {
      logger.error("AUDIT_LOG", `Delete audit logs by time range failed: ${error.message}`);
      return res.status(500).json({ success: false, message: error.message });
    }
  };
}
