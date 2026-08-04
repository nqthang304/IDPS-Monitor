// idpsStatus
export type IdpsMode = 'ids' | 'ips';

export interface IdpsStatusResponse {
  active: boolean;
  mode: IdpsMode;
}

export interface IdpsUpdatePayload {
  active: boolean;
  mode: IdpsMode;
}

// Packet & Stats Types & Chart
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
  totalPackets: number; // Tổng số gói tin (Packages)
  totalBytes: number;  // Tổng dung lượng (Bytes)
}

export interface IDPSDashboardData {
  summary: IDPSStats;
  onsec: IDPSStats;
  percentages: {
    malwareAlertPct: number;  // % (malwareAlert / alert)
    malwareDropPct: number;   // % (malwareDrop / drop)
  };
  serverTimestamp: number;
}

export interface IdpsActiveRuleCount {
  count: number;
}

export interface IdpsRule {
  id: number; // Database ID, not exposed to client
  ruleId: number;
  status: boolean;
  description: string;
  srcIP: string;
  dstIP: string;
  srcPort: number;
  dstPort: number;
  protocol: "TCP" | "UDP" | "ICMP";
  action: "Alert" | "Drop";
  severity: number;
  createdAt: string;
}

export interface IRulesWithPagination {
  rules: IdpsRule[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface BulkImportResponse {
  success: boolean;
  message: string;
  data: any;
}

// analyze types
// 1.Chi tiết thống kê cho từng loại Action (Normal, Drop, Alert)
export interface ActionStats {
  totalBytes: number;
  avgBitrate: number;  
  peakBitrate: number; 
}

// 2. Dữ liệu cho biểu đồ đường (Timeseries)
export interface TrafficDataPoint {
  timestamp: number;
  normal: number;
  alert: number;
  drop: number;
}

export interface IPTimeSeriesPoint {
  timestamp: number;
  bits: number;
}

// 3. Thực thể IP cho các bảng "Top Source/Destination"
export interface TopIPEntry {
  ipAddress: string;
  bits: number;
  packets: number;
  history: IPTimeSeriesPoint[];
}

// 4. Dữ liệu cho biểu đồ tròn (Traffic Trends/Protocols)
export interface ProtocolStats {
  tcp: number;
  udp: number;
  icmp: number;
  others?: number;
}

// 5. Interface TỔNG hợp nhất cho toàn bộ trang
export interface AnalyzeTrafficResponse {
  // Phần Header & Overview
  totalProcessedBytes: number; 
  avgProcessedBitrate: number;
  peakProcessedBitrate: number;

  // Dữ liệu cho biểu đồ Area Chart ở trên cùng
  timeSeriesData: TrafficDataPoint[];

  // Chi tiết từng loại traffic (Normal, Dropped, Alert)
  stats: {
    normal: ActionStats;
    drop: ActionStats;
    alert: ActionStats;
  };

  // Bảng Top Source IP Address
  topSourceIps: TopIPEntry[];

  // Bảng Top Destination IP Address
  topDestinationIps: TopIPEntry[];

  // Thống kê giao thức (Pie chart - Traffic Trends)
  protocolBreakdown: ProtocolStats;
}