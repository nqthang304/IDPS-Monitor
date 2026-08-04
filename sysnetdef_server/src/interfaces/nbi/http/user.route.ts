import { Router } from "express";
import { UserController } from "../../../modules/common/user/user.controller";
import { authenticate } from "../../../shared/middleware/auth.middleware";

const router = Router();
const userController = new UserController();

// Profile endpoints
router.get("/profile", authenticate, userController.getProfile);
router.put("/profile", authenticate, userController.updateProfile);

// User Management CRUD endpoints
router.get("/", authenticate, userController.getAllUsers);
router.get("/:id", authenticate, userController.getUserById);
router.post("/", authenticate, userController.createUser);
router.put("/:id", authenticate, userController.updateUser);
router.delete("/:id", authenticate, userController.deleteUser);

export default router;
