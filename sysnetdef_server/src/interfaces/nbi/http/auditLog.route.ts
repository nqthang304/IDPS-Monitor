import { Router } from "express";
import { AuditLogController } from "../../../modules/common/auditLog/auditLog.controller";
import { authenticate, requireAdmin } from "../../../shared/middleware/auth.middleware";

const router = Router();
const auditLogController = new AuditLogController();

// Tất cả các route Audit Logs chỉ dành cho Admin
router.get("/", authenticate, requireAdmin, auditLogController.getLogs);
router.post("/delete-by-ids", authenticate, requireAdmin, auditLogController.deleteByIds);
router.post("/delete-by-range", authenticate, requireAdmin, auditLogController.deleteByTimeRange);

export default router;
