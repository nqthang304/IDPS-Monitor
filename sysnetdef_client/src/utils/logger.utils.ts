// src/utils/logger.utils.ts

// Định nghĩa các module tương ứng với cấu trúc features của bạn
const MODULE_SETTINGS = {
  APP: 'ON',               // Log cho vòng đời ứng dụng (App.tsx, main.tsx)
  API: 'ON',               // Log cho axiosClient (src/config/api/axiosClient.ts)
  SOCKET: 'ON',            // Log cho websocket (src/config/socket/socket.ts)
  AUTH: 'ON',              // Log cho đăng nhập (src/features/auth/...)
  ANTIDDOS: 'OFF',         // Log riêng cho tính năng AntiDDoS
  IDPS: 'OFF',             // Log riêng cho tính năng IDPS
  IPSEC: 'OFF',            // Log riêng cho tính năng IPsec
  LOGS_MANAGER: 'OFF',     // Log cho phần quản lý Logs
  SYSTEM_NOTIFICATION: 'ON'// Log cho các thông báo hệ thống
} as const;

export type LogModule = keyof typeof MODULE_SETTINGS;

// Sử dụng Object thay cho Enum để tránh lỗi tsconfig (erasableSyntaxOnly)
export const LogLevel = {
  INFO: 'INFO',
  SUCCESS: 'SUCCESS',
  WARN: 'WARN',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG'
} as const;

export type LogLevelType = typeof LogLevel[keyof typeof LogLevel];

const COLORS = {
  time: 'color: #00BCD4;', 
  module: 'color: #E91E63; font-weight: bold;', 
  highlight: 'color: #29B6F6; font-weight: bold;', 
  default: 'color: inherit;',
  levels: {
    [LogLevel.INFO]: 'color: #2196F3; font-weight: bold;', 
    [LogLevel.SUCCESS]: 'color: #4CAF50; font-weight: bold;', 
    [LogLevel.WARN]: 'color: #FFC107; font-weight: bold;', 
    [LogLevel.ERROR]: 'color: #F44336; font-weight: bold;', 
    [LogLevel.DEBUG]: 'color: #00BCD4; font-weight: bold;'  
  }
};

class Logger {
  private getCurrentTime(): string {
    return new Date().toLocaleString('en-GB', { hour12: false });
  }

  private shouldLog(module: LogModule): boolean {
    return MODULE_SETTINGS[module] === 'ON';
  }

  private printLog(level: LogLevelType, module: LogModule, message: string) {
    if (!this.shouldLog(module)) return;

    const time = `[${this.getCurrentTime()}]`;
    const mod = `[${module.toUpperCase()}]`;
    const levelStr = level.padEnd(7);

    let template = `%c${time} %c${levelStr} %c${mod} `;
    const cssArgs = [COLORS.time, COLORS.levels[level], COLORS.module];

    const colonIndex = message.indexOf(':');
    if (colonIndex !== -1) {
      const msgBeforeColon = message.substring(0, colonIndex + 1);
      const msgAfterColon = message.substring(colonIndex + 1);
      
      template += `%c${msgBeforeColon}%c${msgAfterColon}`;
      cssArgs.push(
        level === LogLevel.ERROR ? COLORS.levels[LogLevel.ERROR] : COLORS.default,
        COLORS.highlight
      );
    } else {
      template += `%c${message}`;
      cssArgs.push(level === LogLevel.ERROR ? COLORS.levels[LogLevel.ERROR] : COLORS.default);
    }

    switch (level) {
      case LogLevel.ERROR: console.error(template, ...cssArgs); break;
      case LogLevel.WARN: console.warn(template, ...cssArgs); break;
      case LogLevel.INFO:
      case LogLevel.SUCCESS: console.info(template, ...cssArgs); break;
      case LogLevel.DEBUG:
      default: console.log(template, ...cssArgs); break;
    }
  }

  public info(module: LogModule, message: string) { this.printLog(LogLevel.INFO, module, message); }
  public success(module: LogModule, message: string) { this.printLog(LogLevel.SUCCESS, module, message); }
  public warn(module: LogModule, message: string) { this.printLog(LogLevel.WARN, module, message); }
  public error(module: LogModule, message: string) { this.printLog(LogLevel.ERROR, module, message); }
  public debug(module: LogModule, message: string) { this.printLog(LogLevel.DEBUG, module, message); }
}

export const logger = new Logger();