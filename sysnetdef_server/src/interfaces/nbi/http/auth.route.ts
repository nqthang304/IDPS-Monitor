import { Router } from "express";
import { AuthController } from "../../../modules/common/user/auth/auth.controller";
import { authenticate } from "../../../shared/middleware/auth.middleware";

const router = Router();
const authController = new AuthController();

router.post("/login", authController.login);
router.get("/verify", authenticate, authController.verify);

export default router;