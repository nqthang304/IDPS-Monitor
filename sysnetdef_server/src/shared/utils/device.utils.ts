import fs from 'fs';
import path from 'path';
import * as si from 'systeminformation';
import { createCanvas } from 'canvas';
import { format } from 'date-fns';
import { ENV } from '#/core/config/env'; // Giả định alias config của bạn

/**
 * Interface cho chi tiết file log
 */
export interface LogFileDetail {
  filename: string;
  createdAt: string;
  lastModified: string;
  size: number;
}

/**
 * Interface cho thông tin dung lượng đĩa
 */
export interface StorageInfo {
  type: string;
  total: number;
  free: number;
  used: number;
  usedPercentage: number;
}

/**
 * Lấy danh sách chi tiết các file .log trong một thư mục
 */
export const getFileDetails = (directoryPath: string): { logDetails: LogFileDetail[], logSize: number } => {
  let logDetails: LogFileDetail[] = [];
  let totalSize = 0;

  // Hàm đệ quy duyệt thư mục
  const walkDirectory = (dir: string) => {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        // Nếu là thư mục, gọi đệ quy tiếp
        walkDirectory(filePath);
      } else if (stats.isFile() && path.extname(file).toLowerCase() === '.log') {
        // Nếu là file .log, cộng dồn
        totalSize += stats.size;
        logDetails.push({
          filename: file, // Hoặc dùng filePath nếu bạn muốn biết đường dẫn đầy đủ
          createdAt: format(stats.birthtime, "dd/MM/yyyy HH:mm:ss"),
          lastModified: format(stats.mtime, "dd/MM/yyyy HH:mm:ss"),
          size: stats.size,
        });
      }
    }
  };

  try {
    walkDirectory(directoryPath);
    return { logDetails, logSize: totalSize };
  } catch (err) {
    console.error("Error scanning directory:", err);
    return { logDetails: [], logSize: 0 };
  }
};

/**
 * Lấy thông tin dung lượng ổ đĩa từ hệ thống
 */
export const getStorageInfo = async (): Promise<StorageInfo | null> => {
  try {
    const diskPath = ENV.DISK_PATH || "/"; // Lấy từ biến môi trường
    const fsSize = await si.fsSize();
    const disk = fsSize.find((d) => d.mount === diskPath) || fsSize[0];

    if (!disk) return null;

    return {
      type: disk.mount,
      total: disk.size,
      free: disk.available,
      used: disk.used,
      usedPercentage: parseFloat(((disk.used / disk.size) * 100).toFixed(2)),
    };
  } catch (error) {
    console.error("Error getting storage info:", error);
    return null;
  }
};

/**
 * Kiểm tra tính hợp lệ của IP (v4 hoặc v6)
 */
export const checkIPValidity = (ip: string): "Valid IPv4" | "Valid IPv6" | "Invalid IP" => {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

  if (ipv4Regex.test(ip)) {
    const isV4 = ip.split(".").every((num) => {
      const n = parseInt(num);
      return n >= 0 && n <= 255;
    });
    return isV4 ? "Valid IPv4" : "Invalid IP";
  }
  return ipv6Regex.test(ip) ? "Valid IPv6" : "Invalid IP";
};

/**
 * Xóa IP trùng lặp trong file text
 */
export const removeDuplicateIPs = (filePath: string): void => {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split(/\s+/).filter(Boolean);
  const uniqueLines = Array.from(new Set(lines));
  fs.writeFileSync(filePath, uniqueLines.join("\n"), "utf-8");
};

/**
 * Tạo ảnh đại diện mặc định dựa trên tên người dùng
 */
export const generateProfileImage = async (username: string, name: string): Promise<void> => {
  const names = name.split(" ");
  let initials = names[0][0].toUpperCase();
  if (names.length > 1) {
    initials += names[names.length - 1][0].toUpperCase();
  }

  const canvas = createCanvas(200, 200);
  const ctx = canvas.getContext("2d");

  const getRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) color += letters[Math.floor(Math.random() * 16)];
    return color;
  };

  const getContrastYIQ = (hexcolor: string) => {
    hexcolor = hexcolor.replace("#", "");
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "black" : "white";
  };

  let backgroundColor: string;
  do {
    backgroundColor = getRandomColor();
  } while (getContrastYIQ(backgroundColor) !== "white");

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, 200, 200);
  ctx.fillStyle = "white";
  ctx.font = "bold 40px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initials, 100, 100);

  const uploadPath = path.join(process.cwd(), "public", "uploads", username);
  const imagePath = path.join(uploadPath, "default.png");

  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  const out = fs.createWriteStream(imagePath);
  const stream = canvas.createPNGStream();
  stream.pipe(out);
};