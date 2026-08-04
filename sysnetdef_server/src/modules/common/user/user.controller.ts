import { Request, Response } from "express";
import { UserService } from "./user.service";
import { logger } from "@/shared/utils/logger.utils";

export class UserController {
  private userService = new UserService();

  getProfile = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthenticated" });
      }
      const profile = await this.userService.getProfile(userId);
      return res.status(200).json({ success: true, data: profile });
    } catch (error: any) {
      logger.error("USER_CONTROLLER", `Get profile failed: ${error.message}`);
      return res.status(400).json({ success: false, message: error.message });
    }
  };

  updateProfile = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthenticated" });
      }
      const updatedProfile = await this.userService.updateUser(userId, req.body);
      logger.success("USER_CONTROLLER", `Profile updated for user ID ${userId}`);
      return res.status(200).json({ success: true, data: updatedProfile });
    } catch (error: any) {
      logger.error("USER_CONTROLLER", `Update profile failed: ${error.message}`);
      return res.status(400).json({ success: false, message: error.message });
    }
  };

  getAllUsers = async (req: Request, res: Response) => {
    try {
      const users = await this.userService.getAllUsers();
      return res.status(200).json({ success: true, data: users });
    } catch (error: any) {
      logger.error("USER_CONTROLLER", `Get all users failed: ${error.message}`);
      return res.status(400).json({ success: false, message: error.message });
    }
  };

  createUser = async (req: Request, res: Response) => {
    try {
      const newUser = await this.userService.createUser(req.body);
      logger.success("USER_CONTROLLER", `Created new user: ${newUser.username}`);
      return res.status(201).json({ success: true, data: newUser });
    } catch (error: any) {
      logger.error("USER_CONTROLLER", `Create user failed: ${error.message}`);
      return res.status(400).json({ success: false, message: error.message });
    }
  };

  updateUser = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const updatedUser = await this.userService.updateUser(id, req.body);
      logger.success("USER_CONTROLLER", `Updated user ID ${id}`);
      return res.status(200).json({ success: true, data: updatedUser });
    } catch (error: any) {
      logger.error("USER_CONTROLLER", `Update user failed: ${error.message}`);
      return res.status(400).json({ success: false, message: error.message });
    }
  };

  deleteUser = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      await this.userService.deleteUser(id);
      logger.success("USER_CONTROLLER", `Deleted user ID ${id}`);
      return res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error: any) {
      logger.error("USER_CONTROLLER", `Delete user failed: ${error.message}`);
      return res.status(400).json({ success: false, message: error.message });
    }
  };
}
