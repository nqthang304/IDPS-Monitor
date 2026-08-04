import * as net from 'net';
import { ENV } from '#/core/config/env';
import { logger } from '#/shared/utils/logger.utils';

export class TcpService {
  private static readonly PORT = ENV.TCP_PORT || 3367;
  private static readonly HOST = '127.0.0.1';
  private static readonly IS_PRODUCTION = ENV.NODE_ENV === 'production';
  private static readonly MINUTES_TIMEOUT = 5; // số phút
  private static readonly HARDWARE_TIMEOUT = this.MINUTES_TIMEOUT * 60 * 1000; // sô phút * 60 * 1000ms

  static async sendCommandToCProgram(command: string): Promise<string> {
    if (!this.IS_PRODUCTION) {
      logger.info('HARDWARE_DRIVER', `[Fake] Sending command to C: ${command}$DONE$1$`);
      await new Promise(resolve => setTimeout(resolve, 10000)); 
      const response = command + '$OK$';
      logger.success('HARDWARE_DRIVER', `[Fake] mainC response: ${response}`);
      return response;
    } else {
      logger.info('HARDWARE_DRIVER', `Sending command to C (Timeout: ` + this.MINUTES_TIMEOUT + `m): ${command}$DONE$1$ `);
      return new Promise((resolve, reject) => {
        const client = new net.Socket();
        client.setTimeout(this.HARDWARE_TIMEOUT);
        client.connect(this.PORT, this.HOST, () => {
          client.write(`${command}$DONE$1$`);
        });
        client.on('data', (data) => {
          const response = data.toString().trim();
          logger.success('HARDWARE_DRIVER', `mainC response: ${response}`);
          client.destroy(); // Đóng socket ngay sau khi nhận đủ data
          resolve(response);
        });
        client.on('error', (err) => {
          logger.error('HARDWARE_DRIVER', `Socket error: ${err.message}`);
          client.destroy();
          reject(new Error('Unable to connect to hardware (mainC)'));
        });
        client.on('timeout', () => {
          logger.error('HARDWARE_DRIVER', `Communication timed out after 5 minutes`);
          client.destroy();
          // Lỗi này sẽ kích hoạt thông báo thất bại trong HardwareBridge
          reject(new Error('The hardware is unresponsive within the specified time (' + this.MINUTES_TIMEOUT + ' minutes)'));
        });
      });
    }
  }
 
  static async checkMainCConnection(): Promise<boolean> {
    if (!this.IS_PRODUCTION) return true;
    return new Promise((resolve) => {
      const client = new net.Socket();
      let isResolved = false;
      client.setTimeout(200);
      const finish = (status: boolean) => {
        if (!isResolved) {
          isResolved = true;
          client.destroy();
          resolve(status);
        }
      };
      client.connect(this.PORT, this.HOST, () => finish(true));
      client.on('error', () => finish(false));
      client.on('timeout', () => finish(false));
    });
  }
}