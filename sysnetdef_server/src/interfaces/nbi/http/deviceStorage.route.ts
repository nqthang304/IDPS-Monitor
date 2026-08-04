import { Router } from "express";
import { DeviceStorageController } from "#/modules/common/device/deviceStorage.controller";
import { authenticate } from "@/shared/middleware/auth.middleware";

const router = Router();
const storageController = new DeviceStorageController();

// --- ROUTES QUẢN LÝ THIẾT BỊ & LƯU TRỮ ---

/**
 * @route   GET /api/device/resources
 * @desc    Lấy thông tin tài nguyên hệ thống (CPU, RAM, Uptime, Nhiệt độ)
 * @access  Private
 */
router.get("/resources", authenticate, storageController.getResources);

/**
 * @route   GET /api/device/disk-usage
 * @desc    Lấy thông tin dung lượng ổ đĩa và chi tiết các file logs
 * @access  Private
 */
router.get("/disk-usage", authenticate, storageController.getDiskStatus);

/**
 * @route   PATCH /api/device/disk-settings
 * @desc    Cập nhật cấu hình ngưỡng đĩa và chế độ tự động xóa logs
 * @access  Private
 */
router.patch("/disk-settings", authenticate, storageController.updateSettings);

// Bạn có thể thêm các route bổ sung nếu sau này phát triển thêm logic
// Ví dụ: Export thông tin cấu hình hoặc Reset thông số phần cứng
// router.post("/reset-stats", authenticate, storageController.resetHardwareStats);

export default router;