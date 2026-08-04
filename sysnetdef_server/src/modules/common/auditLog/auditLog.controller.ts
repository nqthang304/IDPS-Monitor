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
}
