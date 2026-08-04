import { Router } from "express";
import { AuditLogController } from "../../../modules/common/auditLog/auditLog.controller";
import { authenticate } from "../../../shared/middleware/auth.middleware";

const router = Router();
const auditLogController = new AuditLogController();

router.get("/", authenticate, auditLogController.getLogs);

export default router;
