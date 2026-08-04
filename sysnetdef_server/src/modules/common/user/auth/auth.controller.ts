import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { logger } from "@/shared/utils/logger.utils";

export class AuthController {
  private authService = new AuthService();

  // AuthController.ts
  login = async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      const result = await this.authService.login(username, password);
      logger.success("AUTH_CONTROLLER","Login successful !");
      return res.status(200).json({
        success: true,
        data: {
          token: result.token,
          user: result.user,
        },
      });
    } catch (error: any) {
      logger.error("AUTH_CONTROLLER","Login failed!");
      return res.status(401).json({ success: false, message: error.message });
    }
  };

  verify = async (req: Request, res: Response) => {
    logger.info("AUTH_CONTROLLER","Valid Json Web Token");
    return res.status(200).json({
      success: true,
      data: (req as any).user,
    });
  };
}
