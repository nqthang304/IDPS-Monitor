import dotenv from "dotenv";
import os from "os";
import path from "path";
import { logger } from "#/shared/utils/logger.utils";

dotenv.config();

const missingEnvs: string[] = [];
const isLinux = os.platform() === "linux";
const rootPath = process.cwd();

const getEnv = (
  key: string,
  defaultValue?: string,
  isRequired: boolean = false,
): string => {
  const value = process.env[key] || defaultValue;

  if (isRequired && !process.env[key] && defaultValue === undefined) {
    missingEnvs.push(key);
  }

  return value || "";
};

export const ENV = {
  NODE_ENV: getEnv("NODE_ENV", "development"),
  PORT: parseInt(getEnv("PORT", "3000"), 10),
  STREAMING_MODE: getEnv("STREAMING_MODE", "disconnected", true),

  // Database
  DB_FILE: getEnv("DB_FILE", path.join(rootPath, "database", "sysnetdef.db")),

  // Network / UDS Paths
  TCP_PORT: parseInt(getEnv("TCP_CONTROL_PORT", "5000"), 10),
  UDS_PATH_IDPS: getEnv("UDS_DATA_PATH_IDPS", "/tmp/snort_log"),

  // Storage Paths
  DISK_PATH: getEnv("DISK_PATH", isLinux ? "/" : "C:"),

  DISK_THRESHOLD_PATH: getEnv(
    "DISK_THRESHOLD_PATH",
    isLinux ? "/home/antiddos/DDoS_V1/Setting/threshold_logfile.conf" : path.join(rootPath, "test", "threshold_logfile.txt")
  ),

  AUTO_MANUAL_PATH: getEnv(
    "AUTO_MANUAL_PATH",
    isLinux ? "/home/antiddos/DDoS_V1/Setting/config_auto_manual.conf" : path.join(rootPath, "test", "config_auto_manual.txt")
  ),

  // IDPS Rules
  IDPS_RULE_PATH: getEnv("IDPS_RULE_PATH", isLinux ? "/zynq_lib/etc/snort_rule/" : path.join(rootPath, "test", "snort_rule")),

  ROOT_LOGS_PATH: getEnv("IDPS_LOGS_PATH", "./logs", true),
  IDPS_LOGS_PATH: getEnv("IDPS_LOGS_PATH", "./logs/Log_IDPS", true),
  NORMAL_LOGS_PATH: getEnv("NORMAL_LOGS_PATH", "./logs/Log_Normal", true),

  // Logging settings
  IDPS_STREAMING_LOGGING: getEnv("IDPS_STREAMING_LOGGING", "OFF"),

  // Auth & Mail
  JWT_SECRET: getEnv("JWT_SECRET", "your_super_secret_key_123", true),
  JWT_EXPIRES: getEnv("JWT_EXPIRES_IN", "1d"),

  EMAIL_USER: getEnv("EMAIL_USER", undefined, true),
  EMAIL_PASSWORD: getEnv("EMAIL_PASSWORD", undefined, true),
  EMAIL_HOST: getEnv("EMAIL_HOST", "smtp.gmail.com"),
  EMAIL_PORT: parseInt(getEnv("EMAIL_PORT", "587"), 10),
};

// --- KIỂM TRA TỔNG THỂ ---
if (missingEnvs.length > 0) {
  logger.error("ENV", "--- CRITICAL: MISSING ENVIRONMENT VARIABLES ---");
  missingEnvs.forEach((env) => {
    logger.error("ENV", `- Required variable is missing: [${env}]`);
  });
  process.exit(1);
} else {
  logger.success("ENV", "All required environment variables are loaded.");
}