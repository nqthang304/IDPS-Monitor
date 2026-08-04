import { Router } from "express";
import { DeviceStorageController } from "#/modules/common/device/deviceStorage.controller";
import { authenticate, requireAdmin } from "@/shared/middleware/auth.middleware";

const router = Router();
const storageController = new DeviceStorageController();

// --- ROUTES QUẢN LÝ LƯU TRỮ VÀ CẤU HÌNH LOGS (CHỈ ADMIN) ---

/**
 * @route   GET /api/device-storage/disk-usage
 * @desc    Lấy thông tin dung lượng ổ đĩa và chi tiết các file logs
 * @access  Private (Admin Only)
 */
router.get("/disk-usage", authenticate, requireAdmin, storageController.getDiskStatus);

/**
 * @route   GET /api/device-storage/logs-retention
 * @route   PUT /api/device-storage/logs-retention
 */
router.get("/logs-retention", authenticate, requireAdmin, storageController.getLogsRetention);
router.put("/logs-retention", authenticate, requireAdmin, storageController.updateLogsRetention);

/**
 * @route   GET /api/device-storage/activity-settings
 * @route   PUT /api/device-storage/activity-settings
 */
router.get("/activity-settings", authenticate, requireAdmin, storageController.getActivitySettings);
router.put("/activity-settings", authenticate, requireAdmin, storageController.updateActivitySettings);

export default router;