import { Router } from "express";
import { UserController } from "../../../modules/common/user/user.controller";
import { authenticate, requireAdmin } from "../../../shared/middleware/auth.middleware";

const router = Router();
const userController = new UserController();

// Profile endpoints (Tất cả người dùng đã đăng nhập)
router.get("/profile", authenticate, userController.getProfile);
router.put("/profile", authenticate, userController.updateProfile);

// User Management CRUD endpoints (Chỉ Admin)
router.get("/", authenticate, requireAdmin, userController.getAllUsers);
router.post("/", authenticate, requireAdmin, userController.createUser);
router.put("/:id", authenticate, requireAdmin, userController.updateUser);
router.delete("/:id", authenticate, requireAdmin, userController.deleteUser);

export default router;
