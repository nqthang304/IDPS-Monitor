import { Router, Request, Response, NextFunction } from "express";
import { IdpsRuleController } from "#/modules/idps/idpsRules.controller";
import { authenticate } from "../../../shared/middleware/auth.middleware";
import multer from "multer";

const router = Router();
const idpsRuleController = new IdpsRuleController();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.rules') || file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Only accept .rules files'));
    }
  }
});

// Helper để bắt lỗi từ Multer (Tránh crash hoặc trả về HTML error)
const uploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

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

// Import/Export
router.post("/bulk-import", authenticate, uploadMiddleware, idpsRuleController.bulkImport);

// Logs & Analytics
router.get("/analyze", authenticate, idpsRuleController.analyzeTraffic);
router.get("/log-files", authenticate, idpsRuleController.getLogFiles);
router.get("/logs/download/:fileId", authenticate, idpsRuleController.downloadLogFile);

export default router;