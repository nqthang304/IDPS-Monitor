import { blue, green, yellow, red, magenta, cyan, bold, blueBright } from 'colorette';
import { ENV } from '#/core/config/env';

const MODULE_SETTINGS = {
  REPO: 'OFF',
  SERVICE: 'OFF',
  CONTROLLER: 'OFF',
  HARDWARE_BRIDGE: 'ON',
  HARDWARE_DRIVER: 'ON',
  SYSTEM_NOTIFICATION: 'ON',
  APP: 'ON',
  ENV: 'ON',
  IDPS_REPO: 'OFF',
  SYS_CONFIG: 'OFF',
  DEVICE_STORAGE_SERVICE: 'ON',
  IDPS_SERVICE: 'OFF',
  IDPS_HANDLER_SERVICE: 'OFF',
  AUTH_CONTROLLER: 'OFF',
  IDPS_CONTROLLER: 'OFF',
  STORAGE_CONTROLLER: 'OFF',
  IDPS_STREAMING: 'ON',
  IDPS_STREAMING_LOGGING: null,
} as const;

export type LogModule = keyof typeof MODULE_SETTINGS;

enum LogLevel {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

class Logger {
  private getCurrentTime(): string {
    return new Date().toLocaleString('en-GB', { hour12: false });
  }

  private shouldLog(module: LogModule): boolean {
    const configValue = MODULE_SETTINGS[module];
    if (configValue === null) {
      if (module === 'IDPS_STREAMING_LOGGING') return ENV.IDPS_STREAMING_LOGGING === 'ON';
      return false;
    }
    return configValue === 'ON';
  }

  private highlightColon(message: string): string {
    const colonIndex = message.indexOf(':');
    if (colonIndex === -1) return message;
    const before = message.substring(0, colonIndex + 1);
    const after = message.substring(colonIndex + 1);
    return `${before}${bold(blueBright(after))}`;
  }

  /**
   * Tạo chuỗi xuống dòng dựa trên số lượng yêu cầu
   */
  private getNewLines(count: number): string {
    return '\r\n'.repeat(count);
  }

  private formatMessage(
    level: LogLevel, 
    module: LogModule, 
    message: string, 
    before: number = 0, 
    after: number = 0
  ): string {
    const time = `[${this.getCurrentTime()}]`;
    const mod = `[${module.toUpperCase()}]`;
    const processedMessage = this.highlightColon(message);

    const levelColor: Record<LogLevel, (str: string) => string> = {
      [LogLevel.INFO]: (s) => blue(s.padEnd(7)),
      [LogLevel.SUCCESS]: (s) => green(s.padEnd(7)),
      [LogLevel.WARN]: (s) => yellow(s.padEnd(7)),
      [LogLevel.ERROR]: (s) => red(s.padEnd(7)),
      [LogLevel.DEBUG]: (s) => cyan(s.padEnd(7)),
    };

    const colorFn = levelColor[level] || ((s: string) => s);
    const formattedMsg = level === LogLevel.ERROR ? red(processedMessage) : processedMessage;

    const mainLog = `\r${cyan(time)} ${colorFn(level)} ${magenta(mod)} ${formattedMsg}`;
    
    // Gộp prefix và suffix xuống dòng
    return `${this.getNewLines(before)}${mainLog}${this.getNewLines(after)}`;
  }

  // --- PUBLIC METHODS ---

  public info(module: LogModule, message: string, before: number = 0, after: number = 0) {
    if (this.shouldLog(module)) {
      console.log(this.formatMessage(LogLevel.INFO, module, message, before, after));
    }
  }

  public success(module: LogModule, message: string, before: number = 0, after: number = 0) {
    if (this.shouldLog(module)) {
      console.log(this.formatMessage(LogLevel.SUCCESS, module, message, before, after));
    }
  }

  public warn(module: LogModule, message: string, before: number = 0, after: number = 0) {
    if (this.shouldLog(module)) {
      console.warn(this.formatMessage(LogLevel.WARN, module, message, before, after));
    }
  }

  public error(module: LogModule, message: string, before: number = 0, after: number = 0) {
    if (this.shouldLog(module)) {
      console.error(this.formatMessage(LogLevel.ERROR, module, message, before, after));
    }
  }

  public debug(module: LogModule, message: string, before: number = 0, after: number = 0) {
    if (this.shouldLog(module)) {
      console.log(this.formatMessage(LogLevel.DEBUG, module, message, before, after));
    }
  }
}

export const logger = new Logger();