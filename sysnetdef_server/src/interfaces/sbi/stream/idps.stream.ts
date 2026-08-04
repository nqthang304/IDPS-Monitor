import { unlinkSync } from "fs";
import net from "net";
import { Server } from "socket.io";
import { logger } from "@/shared/utils/logger.utils";
import { ENV } from "@/core/config/env";

// --- 1. INTERFACES ---

export interface IDPSPacket {
  timestamp: string;
  srcIP: string;
  dstIP: string;
  srcPort: number;
  dstPort: number;
  action: "Normal" | "Alert" | "Drop";
  ruleType: string;
  severity: number;
  protocol: "TCP" | "UDP" | "ICMP";
  isMalware: 0 | 1;
  // Bổ sung luồng gói tin
  packetCount: number;
  packetSize: number;
}

export interface IDPSStats {
  normal: number;
  alert: number;
  drop: number;
  malware: number;
  malwareAlert: number;
  malwareDrop: number;
  // Bổ sung thông số định lượng
  totalPackets: number; // Tổng số gói tin (Packages)
  totalBytes: number;   // Tổng dung lượng (Bytes)
}

export interface IDPSDashboardData {
  summary: IDPSStats;
  onsec: IDPSStats; // Chứa PPS (Packets Per Second) thông qua trường totalPackets
  percentages: {
    malwareAlertPct: number;
    malwareDropPct: number;
  };
  serverTimestamp: number;
}

// --- 2. LOGIC CHÍNH ---

export function idpsCapture(io: Server) {
  const idpsNamespace = io.of("/idps");

  const statsTemplate = (): IDPSStats => ({
    normal: 0,
    alert: 0,
    drop: 0,
    malware: 0,
    malwareAlert: 0,
    malwareDrop: 0,
    totalPackets: 0,
    totalBytes: 0,
  });

  let idps_Summary = statsTemplate();
  let idps_oneSecStats = statsTemplate();
  let idps_packetArray: IDPSPacket[] = [];

  /**
   * Cập nhật thống kê tích lũy và thống kê theo giây
   */
  const handleIDPSPacket = (packet: IDPSPacket) => {
    // File: idpsCapture logic (Backend)
    const updateStats = (stats: IDPSStats) => {
      stats.totalPackets += packet.packetCount;
      stats.totalBytes += packet.packetSize;

      if (packet.isMalware === 1) {
        stats.malware += packet.packetCount; // Sửa từ ++
        if (packet.action === "Drop") {
          stats.malwareDrop += packet.packetCount; // Sửa từ ++
        } else if (packet.action === "Alert") {
          stats.malwareAlert += packet.packetCount; // Sửa từ ++
        }
      } else {
        if (packet.action === "Normal") {
          stats.normal += packet.packetCount; // Sửa từ ++ (Đây là lý do gói Normal hiển thị sai)
        } else if (packet.action === "Alert") {
          stats.alert += packet.packetCount; // Sửa từ ++
        } else if (packet.action === "Drop") {
          stats.drop += packet.packetCount; // Sửa từ ++
        }
      }
    };

    updateStats(idps_Summary);
    updateStats(idps_oneSecStats);
  };

  const calculatePercentages = (summary: IDPSStats) => {
    const calcPct = (part: number, total: number) => total > 0 ? Number(((part / total) * 100).toFixed(2)) : 0;

    return {
      // Tổng số Drop thực tế = Drop thường + Malware Drop
      malwareDropPct: calcPct(summary.malwareDrop, summary.drop + summary.malwareDrop),

      // Tổng số Alert thực tế = Alert thường + Malware Alert
      malwareAlertPct: calcPct(summary.malwareAlert, summary.alert + summary.malwareAlert),
    };
  };

  // --- 3. KẾT NỐI DỮ LIỆU (UDS hoặc MOCK) ---

  const udsPath = ENV.UDS_PATH_IDPS || "/tmp/idps.sock";

  if (ENV.STREAMING_MODE === "connected") {
    try { unlinkSync(udsPath); } catch (e) { }

    const server = net.createServer((socket) => {
      logger.info('IDPS_STREAMING', '--- THIẾT BỊ IDPS PHÍA DƯỚI ĐÃ KẾT NỐI ---');

      socket.on("data", (data) => {
        const rawContent = data.toString();
        logger.info('IDPS_STREAMING_LOGGING', `RECIVED ${data.length} BYTES WITH DATA : ${rawContent}`);
        const lines = rawContent.trim().split("\n");

        lines.forEach((line) => {
          const cleanLine = line.trim();
          if (!cleanLine) return;

          // Giả định format mới: timestamp | srcIP | dstIP | srcPort | dstPort | action | ruleType | severity | protocol | isMalware | packetCount | packetSize
          const arr = cleanLine.split("|").map(item => item.trim());

          if (arr.length < 12) {
            logger.warn('IDPS_STREAMING', `Dữ liệu không đủ cột (yêu cầu 12): ${cleanLine}`);
            return;
          }

          const packetObj: IDPSPacket = {
            timestamp: arr[0],
            srcIP: arr[1],
            dstIP: arr[2],
            srcPort: parseInt(arr[3], 10) || 0,
            dstPort: parseInt(arr[4], 10) || 0,
            action: arr[5] as any,
            ruleType: arr[6],
            severity: parseInt(arr[7], 10) || 0,
            protocol: arr[8] as any,
            isMalware: (parseInt(arr[9], 10) === 1 ? 1 : 0) as 0 | 1,
            // Luồng dữ liệu mới
            packetCount: parseInt(arr[10], 10) || 1,
            packetSize: parseInt(arr[11], 10) || 64,
          };

          idps_packetArray.push(packetObj);
        });
      });

      socket.on("error", (err) => logger.error('IDPS_STREAMING', `Lỗi Socket: ${err.message}`));
    });

    server.listen(udsPath, () => {
      logger.info('IDPS_STREAMING', `Server UDS IDPS Live: ${udsPath}`);
    });
  } else {
    logger.info('IDPS_STREAMING', 'Đang chạy ở chế độ MOCK DATA (Gồm PPS và Total Packages)');
    setInterval(() => {
      const actions: IDPSPacket["action"][] = ["Normal", "Alert", "Drop"];
      const protocols: IDPSPacket["protocol"][] = ["TCP", "UDP", "ICMP"];

      const mockPacket: IDPSPacket = {
        timestamp: new Date().toLocaleTimeString("en-GB"),
        srcIP: `192.168.1.${Math.floor(Math.random() * 254)}`,
        dstIP: "10.0.0.1",
        srcPort: Math.floor(Math.random() * 60000),
        dstPort: 443,
        action: actions[Math.floor(Math.random() * actions.length)],
        ruleType: "Signature_Match",
        severity: Math.floor(Math.random() * 3),
        protocol: protocols[Math.floor(Math.random() * protocols.length)],
        isMalware: Math.random() > 0.9 ? 1 : 0,
        // Giả lập số lượng gói tin ngẫu nhiên mỗi entry để tính PPS
        packetCount: Math.floor(Math.random() * 50) + 1,
        packetSize: Math.floor(Math.random() * 1500) + 64,
      };
      idps_packetArray.push(mockPacket);
    }, 200);
  }

  // --- 4. BROADCAST LÊN FRONTEND ---

  setInterval(() => {
    const totalEntries = idps_packetArray.length;

    // Xử lý dữ liệu trong mảng tạm của 1 giây qua
    if (totalEntries > 0) {
      idps_packetArray.forEach(handleIDPSPacket);
    }

    // Gửi thông số Dashboard
    // onsec.totalPackets lúc này chính là PPS (Packets Per Second)
    // summary.totalPackets chính là Total Packages tích lũy
    idpsNamespace.emit("idps_traffic_stats", {
      summary: idps_Summary,
      onsec: idps_oneSecStats,
      percentages: calculatePercentages(idps_Summary),
      serverTimestamp: Date.now(),
    });

    // Gửi log chi tiết
    idpsNamespace.emit("idps_packet_logs", idps_packetArray.slice(-50));

    // Reset chỉ số giây (PPS) nhưng giữ lại Summary (Total)
    idps_oneSecStats = statsTemplate();
    idps_packetArray = [];
  }, 1000);

  // --- 5. SOCKET.IO EVENTS ---

  idpsNamespace.on("connection", (socket) => {
    logger.info('IDPS_STREAMING', `Dashboard connected: ${socket.id}`);

    socket.emit("idps_initial_summary", {
      summary: idps_Summary,
      percentages: calculatePercentages(idps_Summary)
    });

    socket.on("reset_idps_statistics", () => {
      logger.warn('IDPS_STREAMING', `Resetting statistics: ${socket.id}`);
      idps_Summary = statsTemplate();
      idpsNamespace.emit("reset_confirm", "IDPS statistics reset successful");
    });
  });
}