import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../../core/config/env";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Không có quyền truy cập" });
  }
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET || "default_secret");
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }
};