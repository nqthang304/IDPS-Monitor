import mailer from "nodemailer";
import ejs from "ejs";
import path from "path";
import { ENV } from "../../core/config/env";
import { UserRepository } from "../../database/repository/user.repository";

const userRepository = new UserRepository();

// --- INTERFACES ---
interface User {
  id: number;
  username: string;
  email: string;
  notifyDiskExceeds: number;
  notifyDDoSAttackDetect: number;
  notifyDDoSAttackEnd: number;
  notifyNetworkAnomalyDetect: number;
}

interface AttackInfo {
  siteAddress?: string;
  srcIP?: string;
  dstIP?: string;
  attackType?: string;
  packetCount?: number;
  [key: string]: any;
}

// --- CONFIGURATION ---
const mailTransport = mailer.createTransport({
  service: "gmail",
  auth: {
    user: ENV.EMAIL_USER,      // Cập nhật từ ENV
    pass: ENV.EMAIL_PASSWORD,  // Cập nhật từ ENV
  },
});

const pathBuild = (process as any).pkg ? process.cwd() : __dirname;
// Giả định địa chỉ site, bạn có thể thêm HOST vào ENV nếu cần
const SITE_URL = `http://localhost:${ENV.PORT}`; 

// --- FUNCTIONS ---

export const sendDiskFullAlertEmail = async (diskUsage: number): Promise<void> => {
  try {
    const users = await userRepository.getAllUsers();
    const usersToNotify = users.filter((user: any) => user.notifyDiskExceeds === 1);

    if (usersToNotify.length === 0) return;

    const warning = {
      message: "Cảnh báo: Dung lượng đĩa đang thấp!",
      diskUsage: diskUsage.toFixed(2),
      siteAddress: SITE_URL,
      time: new Date().toLocaleString(),
      freeSpace: (100 - diskUsage).toFixed(2),
    };

    const templatePath = path.join(pathBuild, "../../../public/mails/disk_full.ejs");
    const html = await ejs.renderFile(templatePath, warning);

    const emailPromises = usersToNotify.map((user: any) => {
      return mailTransport.sendMail({
        from: ENV.EMAIL_USER,
        to: user.email,
        subject: "Sysnet Defender Cảnh báo: Dung lượng đĩa thấp",
        html,
        attachments: [
          {
            filename: "ddos_logo.png",
            path: path.join(pathBuild, "../../../public/images/ddos_logo.png"),
            cid: "warninglogo",
          },
          {
            filename: "disk-storage.png",
            path: path.join(pathBuild, "../../../public/images/disk-storage.png"),
            cid: "disklogo",
          },
        ],
      });
    });

    await Promise.all(emailPromises);
  } catch (error) {
    console.error("Error in sendDiskFullAlertEmail:", error);
  }
};

export const sendAlertEmailAttack = async (attack: AttackInfo): Promise<void> => {
  try {
    attack.siteAddress = SITE_URL;
    const html = await ejs.renderFile(
      path.join(pathBuild, "../../../public/mails/warn.ejs"),
      { attack }
    );

    const users = await userRepository.getAllUsers();
    const usersToNotify = users.filter((user: any) => user.notifyDDoSAttackDetect === 1);

    const emailPromises = usersToNotify.map((user: any) => {
      return mailTransport.sendMail({
        from: ENV.EMAIL_USER,
        to: user.email,
        subject: "Sysnet Defender Warning: Possible Attack Detected",
        html,
        attachments: [
          {
            filename: "ddos_logo.png",
            path: path.join(pathBuild, "../../../public/images/ddos_logo.png"),
            cid: "acslogo",
          },
        ],
      });
    });

    await Promise.all(emailPromises);
  } catch (error) {
    console.error("Error in sendAlertEmailAttack:", error);
  }
};

export const sendAlertEmailEnd = async (attack: AttackInfo): Promise<void> => {
  try {
    attack.siteAddress = SITE_URL;
    const html = await ejs.renderFile(
      path.join(pathBuild, "../../../public/mails/end.ejs"),
      { attack }
    );

    const users = await userRepository.getAllUsers();
    const emailPromises = users
      .filter((user: any) => user.notifyDDoSAttackEnd === 1)
      .map((user: any) => {
        return mailTransport.sendMail({
          from: ENV.EMAIL_USER,
          to: user.email,
          subject: "Sysnet Defender Notice: Attack Ended",
          html,
          attachments: [
            {
              filename: "ddos_logo.png",
              path: path.join(pathBuild, "../../../public/images/ddos_logo.png"),
              cid: "acslogo",
            },
          ],
        });
      });

    await Promise.all(emailPromises);
  } catch (error) {
    console.error("Error in sendAlertEmailEnd:", error);
  }
};

export const sendWarningEmail = async (warning: any): Promise<void> => {
  try {
    warning.siteAddress = SITE_URL;
    const html = await ejs.renderFile(
      path.join(pathBuild, "../../../public/mails/vulnerable.ejs"),
      { warning }
    );

    const users = await userRepository.getAllUsers();
    const emailPromises = users
      .filter((user: any) => user.notifyNetworkAnomalyDetect === 1)
      .map((user: any) => {
        return mailTransport.sendMail({
          from: ENV.EMAIL_USER,
          to: user.email,
          subject: "Sysnet Defender Alert: System Warning",
          html,
          attachments: [
            {
              filename: "system_warning.png",
              path: path.join(pathBuild, "../../../public/images/system_warning.png"),
              cid: "warninglogo",
            },
          ],
        });
      });

    await Promise.all(emailPromises);
  } catch (error) {
    console.error("Error in sendWarningEmail:", error);
  }
};