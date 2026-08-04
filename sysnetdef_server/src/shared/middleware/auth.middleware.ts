import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../../core/config/env";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized access" });
  }
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET || "default_secret");
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: "Invalid or expired token" });
  }
};

export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized access" });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ success: false, message: "Access denied. Insufficient permissions." });
    }

    next();
  };
};

export const requireAdmin = requireRole("admin");