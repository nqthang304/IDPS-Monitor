import type { ThemeConfig } from 'antd';

// 1. (Tùy chọn nhưng khuyên dùng) Định nghĩa Interface để export ra cho các file Chart xài
export interface CustomThemeTokens {
  tcpColor: string;
  udpColor: string;
  httpColor: string;
  icmpColor: string;
  dnsColor: string;
  espColor: string;
  unknownColor: string;
  synFloodColor: string;
  udpFloodColor: string;
  icmpFloodColor: string;
  httpFloodColor: string;
  httpsFloodColor: string;
  dnsFloodColor: string;
  ipsecColor: string;
  tcpFragColor: string;
  udpFragColor: string;
  landColor: string;
  normal: string;
  bypassColor: string; 
  idpsNormal: string;
  idpsAlert: string;
  idpsDrop: string;
  idpsMalwareAlert: string;
  idpsMalwareDrop: string;
  ddosNormal: string;
  ddosAttack: string;
}

// 2. Hàm cấu hình theme kết hợp cả dynamic font size và custom colors
export const getThemeConfig = (dynamicFontSize: number): ThemeConfig => ({
  token: {
    // --- Các thông số cốt lõi (Shared Tokens) ---
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: dynamicFontSize,
    fontWeightStrong: 600,

    fontWeightHeading: 600,

    colorText: '#000000',
    borderRadius: 6, // Bo góc đồng bộ cho toàn bộ nút, ô nhập, card
    
    // --- Các thông số màu Custom của Anti-DDoS  ---
    ...({
      // Protocol colors
      tcpColor: '#EE6666',
      udpColor: '#FC8452',
      httpColor: '#73C0DE',
      icmpColor: '#5470C6',
      dnsColor: '#91CC75',
      espColor: '#3BA272',
      unknownColor: '#BFBFBF',

      // Attack colors
      synFloodColor: '#EE6666',
      udpFloodColor: '#FC8452',
      icmpFloodColor: '#5470C6',
      httpFloodColor: '#73C0DE',
      httpsFloodColor: '#15008B',
      dnsFloodColor: '#91CC75',

      ipsecColor: '#FFCD29',
      tcpFragColor: '#9D1F1F',
      udpFragColor: '#F44C06',
      landColor: '#2FFF9E',

      normal: '#AACC07',
      bypassColor: '#1890ff', 

      idpsNormal: '#07cc3b',
      idpsAlert: '#d8d823',
      idpsDrop: '#ff0808',
      idpsMalwareAlert: '#d8d823',
      idpsMalwareDrop: '#ff0808',

      ddosNormal: '#0143DD',
      ddosAttack: '#DD0101',
    } as unknown as any), // Ép kiểu để bypass check của Ant Design ThemeConfig
  },
  
  components: {
    // --- Cấu hình riêng cho từng nhóm (Component Tokens) ---
    Card: {
      headerFontSize: dynamicFontSize + 2,
    },
    Table: {
      headerBg: '#fafafa', // Màu nền tiêu đề bảng
      headerColor: '#1a1a1a',
    },
    Typography: {
      // Tự động tính toán các bậc tiêu đề dựa trên fontSize gốc
      fontSizeHeading1: Math.floor(dynamicFontSize * 2.5),
      fontSizeHeading2: Math.floor(dynamicFontSize * 2.0),
      fontSizeHeading3: Math.floor(dynamicFontSize * 1.5),
    },
    
    // --- Đã GỘP cấu hình Menu mới và Menu cũ ---
    Menu: {
      itemHeight: 40,
      subMenuItemBg: 'transparent',
      // Mang từ project cũ sang:
      darkItemBg: '#090A21',
      darkPopupBg: '#090A21',
      darkSubMenuItemBg: '#090A21', 
    },

    // --- Bổ sung thêm Layout và Collapse từ project cũ ---
    Layout: {
      siderBg: '#090A21',
      triggerBg: '#090A21',
    },
    Collapse: {
      headerBg: '#ffffff',
    }
  },
});