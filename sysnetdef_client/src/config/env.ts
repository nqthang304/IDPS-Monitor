// src/api/env.ts

const missingEnvs: string[] = [];

// Xác định môi trường hiện tại từ biến ENV trong file .env
// Nếu không có, mặc định là development
const currentEnv = (import.meta.env.VITE_ENV || "development").toUpperCase();
console.log("Current env :",currentEnv);

/**
 * Hàm lấy biến môi trường thông minh
 * Tự động ghép thêm hậu tố _DEVELOPMENT hoặc _PRODUCTION tùy theo môi trường
 */
const getEnv = (
  key: string,
  defaultValue?: string,
  isRequired: boolean = false
): string => {
  // Ưu tiên tìm biến có hậu tố môi trường (VD: VITE_API_BASE_URL_DEVELOPMENT)
  const envKey = `${key}_${currentEnv}`;
  let value = import.meta.env[envKey];

  // Nếu không tìm thấy biến có hậu tố, thử tìm biến gốc (VD: VITE_RECONNECT_ATTEMPTS)
  if (value === undefined || value === null || value === "") {
    value = import.meta.env[key];
  }

  if (isRequired && (value === undefined || value === null || value === "")) {
    missingEnvs.push(envKey);
  }

  return value || defaultValue || "";
};

export const ENV = {
  // Chỉ cần truyền key gốc, hàm getEnv sẽ tự động chọn đúng bản DEV hay PROD
  API_BASE_URL: getEnv("VITE_API_BASE_URL", "http://localhost:3000/api", true),

  WS_BASE_URL: getEnv("VITE_WS_BASE_URL", "http://localhost:3000", true),

  // Biến dùng chung cho cả 2 môi trường (không có hậu tố)
  RECONNECT_ATTEMPTS: parseInt(getEnv("VITE_RECONNECT_ATTEMPTS", "5"), 10),

  // Thông tin môi trường
  MODE: currentEnv,
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
};

// --- KIỂM TRA TỔNG THỂ ---
if (missingEnvs.length > 0) {
  console.error("--- ❌ CRITICAL: MISSING FRONTEND ENVIRONMENT VARIABLES ---");
  console.error(`Current Mode: ${currentEnv}`);
  missingEnvs.forEach((env) => {
    console.error(`- Required variable is missing: [${env}]`);
  });
  
  if (import.meta.env.DEV) {
    throw new Error(`[Config Error]: Please update your .env file. Missing: ${missingEnvs.join(", ")}`);
  }
} else {
  if (import.meta.env.DEV) {
    console.log(`✅ [Config]: All required variables loaded for [${currentEnv}] mode.`);
  }
}