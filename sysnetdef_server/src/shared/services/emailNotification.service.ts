import nodemailer from 'nodemailer';
import { UserRepository } from '#/database/repository/user.repository';
import { ENV } from '#/core/config/env';
import { logger } from '@/shared/utils/logger.utils';

export class EmailNotificationService {
  private userRepository = new UserRepository();
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    try {
      if (ENV.EMAIL_USER && ENV.EMAIL_PASSWORD) {
        this.transporter = nodemailer.createTransport({
          host: ENV.EMAIL_HOST || 'smtp.gmail.com',
          port: ENV.EMAIL_PORT || 587,
          secure: false,
          auth: {
            user: ENV.EMAIL_USER.trim(),
            pass: ENV.EMAIL_PASSWORD.trim().replace(/^['"]|['"]$/g, ''),
          },
        });
      }
    } catch (err: any) {
      logger.error("SERVICE", `Failed to initialize SMTP transporter: ${err.message}`);
    }
  }

  /**
   * Gửi Email thông báo sự kiện đến TẤT CẢ User có cấu hình notify = 'enabled'
   */
  async notifySubscribedUsers(subject: string, content: string) {
    try {
      if (!this.transporter) {
        this.initTransporter();
      }

      if (!this.transporter) {
        logger.warn("SERVICE", "Email notification skipped: SMTP user or password not configured.");
        return;
      }

      // 1. Lấy danh sách tất cả người dùng
      const allUsers = await this.userRepository.getAllUsers();

      // 2. Lọc danh sách Email của người dùng bật notify = 'enabled'
      const targetEmails = allUsers
        .filter(user => user.notify === 'enabled' && user.email && user.email.trim() !== '')
        .map(user => user.email!.trim());

      if (targetEmails.length === 0) {
        logger.info("SERVICE", "No users with enabled notifications found.");
        return;
      }

      const mailOptions = {
        from: `"IDPS System Alert" <${ENV.EMAIL_USER}>`,
        to: targetEmails.join(','),
        subject: `[IDPS ALERT] ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="background-color: #001529; padding: 15px; border-radius: 6px 6px 0 0; text-align: center;">
              <h2 style="color: #ffffff; margin: 0;">IDPS Firewall Notification</h2>
            </div>
            <div style="padding: 20px; background-color: #ffffff;">
              <h3 style="color: #1890ff; margin-top: 0;">Event: ${subject}</h3>
              <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #1890ff; margin: 15px 0; font-size: 14px; color: #333;">
                ${content}
              </div>
              <p style="color: #8c8c8c; font-size: 12px; margin-top: 25px;">
                This is an automated notification sent to subscribers of the IDPS Monitor System.
              </p>
            </div>
          </div>
        `,
      };

      // Gửi ngầm (Bất đồng bộ) để không chặn HTTP Request của người dùng
      this.transporter.sendMail(mailOptions).then(() => {
        logger.success("SERVICE", `Notification email sent to ${targetEmails.length} subscriber(s) for event: "${subject}"`);
      }).catch((err: any) => {
        logger.error("SERVICE", `Failed to send email notification: ${err.message}`);
      });

    } catch (error: any) {
      logger.error("SERVICE", `Error in notifySubscribedUsers: ${error.message}`);
    }
  }
}

export const emailNotificationService = new EmailNotificationService();
