import { Router } from "express";
import { AuditLogController } from "../../../modules/common/auditLog/auditLog.controller";
import { authenticate } from "../../../shared/middleware/auth.middleware";

const router = Router();
const auditLogController = new AuditLogController();

router.get("/", authenticate, auditLogController.getLogs);
router.post("/delete-by-ids", authenticate, auditLogController.deleteByIds);
router.post("/delete-by-range", authenticate, auditLogController.deleteByTimeRange);

export default router;
