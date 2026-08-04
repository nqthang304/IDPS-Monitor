import { Router } from "express";
import { IdpsRuleController } from "#/modules/idps/idpsRules.controller";
import { authenticate } from "../../../shared/middleware/auth.middleware";

const router = Router();
const idpsRuleController = new IdpsRuleController();

// --- ROUTES ---

// System & Rules
router.get("/system-status", authenticate, idpsRuleController.getIdpsStatus); // Nên thêm authenticate nếu cần bảo mật
router.patch("/system-status", authenticate, idpsRuleController.updateIdpsStatus);

// Rules Management
router.get("/", authenticate, idpsRuleController.getRules);
router.post("/", authenticate, idpsRuleController.create);
router.put("/:ruleId", authenticate, idpsRuleController.update);
router.patch("/bulk-status", authenticate, idpsRuleController.bulkUpdateStatus);
router.delete("/", authenticate, idpsRuleController.remove); // Cho bulk delete (body: {ids: []})
router.delete("/:ruleId", authenticate, idpsRuleController.remove); // Cho single delete

// Logs & Analytics
router.get("/analyze", authenticate, idpsRuleController.analyzeTraffic);
router.get("/log-files", authenticate, idpsRuleController.getLogFiles);
router.get("/logs/download/:fileId", authenticate, idpsRuleController.downloadLogFile);

export default router;