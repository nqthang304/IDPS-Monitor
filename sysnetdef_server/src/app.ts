import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import fs from "fs";
import cors from "cors";

import { ENV } from "#/core/config/env";
import { db } from "#/core/database/drizzle";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { initializeData } from "#/core/database/data.init";

import authRoutes from "#/interfaces/nbi/http/auth.route";
import idpsRoutes from "#/interfaces/nbi/http/idpsRules.route";
import deviceStorageRoutes from "#/interfaces/nbi/http/deviceStorage.route";

import { notificationWS } from "#/interfaces/nbi/ws/notification.ws";
import { idpsCapture } from "#/interfaces/sbi/stream/idps.stream";

import { logger } from "@/shared/utils/logger.utils";


export const createApp = () => {
  const app = express();
  const httpServer = createServer(app);

  // 1. Cấu hình CORS
  const corsOptions = {
    // Trong production, cho phép chính nó (vì Nginx và Backend cùng IP/Domain)
    // Hoặc tốt nhất là dùng một hàm để kiểm tra
    origin: ENV.NODE_ENV === 'production'
      ? true // Cho phép cùng origin (phù hợp khi dùng Nginx proxy)
      : "http://localhost:5173", // URL của Vite khi dev
    methods: ["GET", "POST","PATCH", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true // Thêm dòng này nếu bạn có dùng Cookie hoặc JWT trong Header
  };
  logger.success("APP", "CORS policy initialized.");

  // 2. Khởi tạo Socket.io
  const io = new Server(httpServer, {
    cors: corsOptions,
    transports: ['websocket', 'polling'],
    path: "/ws"
  });
  logger.success("APP", "Socket.io Server established.");

  // --- MIDDLEWARES ---
  app.use(cors(corsOptions));
  app.use(express.json());
  logger.success("APP", "Express Middlewares (CORS, JSON Parser) applied.");

  // --- DATABASE SETUP ---
  const dbPath = path.resolve(ENV.DB_FILE);
  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    logger.warn("APP", `Created missing database directory: ${dbDir}`);
  }

  try {
    const migrationsFolder = path.resolve(process.cwd(), "drizzle");
    migrate(db, { migrationsFolder });
    initializeData();
    logger.success("APP", "Migration and Initialization completed.");
  } catch (error: any) {
    if (!error.message.includes("no statements")) {
      logger.error("APP", `Setup failed: ${error.message}`);
    }
  }

  // --- SERVICES ---
  // Notification
  notificationWS.init(io);
  // SBI Stream (Southbound Interface)
  try {
    idpsCapture(io);
    logger.success("APP", "SBI Stream service is live");
  } catch (error: any) {
    logger.error("APP", `Failed to start SBI Stream service: ${error.message}`);
  }

  // --- ROUTES ---
  app.use("/api/auth", authRoutes);
  app.use("/api/idps", idpsRoutes);
  app.use("/api/device-storage", deviceStorageRoutes);

  app.get("/ping", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });
  logger.success("APP", "All NBI (Northbound Interface) routes mounted.");

  logger.success("APP", "Application structure ready.");

  return { app, httpServer, dbPath, io };
};