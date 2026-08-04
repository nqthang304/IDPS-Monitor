import { Router } from "express";
import { IdpsRuleController } from "#/modules/idps/idpsRules.controller";
import { authenticate, requireAdmin } from "../../../shared/middleware/auth.middleware";

const router = Router();
const idpsRuleController = new IdpsRuleController();

// --- ROUTES ---

// System & Rules
router.get("/system-status", authenticate, idpsRuleController.getIdpsStatus);
router.patch("/system-status", authenticate, idpsRuleController.updateIdpsStatus);

// Rules Management
router.get("/", authenticate, idpsRuleController.getRules);
router.post("/", authenticate, idpsRuleController.create);
router.put("/:ruleId", authenticate, idpsRuleController.update);
router.patch("/bulk-status", authenticate, idpsRuleController.bulkUpdateStatus);
router.delete("/", authenticate, idpsRuleController.remove); // Cho bulk delete (body: {ids: []})
router.delete("/:ruleId", authenticate, idpsRuleController.remove); // Cho single delete

// Logs & Analytics (Cấu hình log-files & download dành riêng cho Admin)
router.get("/analyze", authenticate, idpsRuleController.analyzeTraffic);
router.get("/log-files", authenticate, requireAdmin, idpsRuleController.getLogFiles);
router.get("/logs/download/:fileId", authenticate, requireAdmin, idpsRuleController.downloadLogFile);

export default router;