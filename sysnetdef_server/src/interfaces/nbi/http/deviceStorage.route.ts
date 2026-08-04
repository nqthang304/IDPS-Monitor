import { Router } from "express";
import { DeviceStorageController } from "#/modules/common/device/deviceStorage.controller";
import { authenticate } from "@/shared/middleware/auth.middleware";

const router = Router();
const storageController = new DeviceStorageController();

// --- ROUTES QUẢN LÝ LƯU TRỮ VÀ CẤU HÌNH ---

/**
 * @route   GET /api/device-storage/disk-usage
 * @desc    Lấy thông tin dung lượng ổ đĩa và chi tiết các file logs
 * @access  Private
 */
router.get("/disk-usage", authenticate, storageController.getDiskStatus);

/**
 * @route   GET /api/device-storage/logs-retention
 * @route   PUT /api/device-storage/logs-retention
 */
router.get("/logs-retention", authenticate, storageController.getLogsRetention);
router.put("/logs-retention", authenticate, storageController.updateLogsRetention);

/**
 * @route   GET /api/device-storage/activity-settings
 * @route   PUT /api/device-storage/activity-settings
 */
router.get("/activity-settings", authenticate, storageController.getActivitySettings);
router.put("/activity-settings", authenticate, storageController.updateActivitySettings);

export default router;