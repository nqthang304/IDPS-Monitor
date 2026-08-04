import React, { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react';
import { idpsSocket, systemNotificationSocket } from '@/config/socket/socket';
import { useIdpsStore } from '@/features/modules/idps/dashboard_page/store/idpsStore';
import { useLockStore } from '@/system/stores/useLockStore';
import { logger } from '@/utils/logger.utils'; 

const SocketContext = createContext<any>(null);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const setLocked = useLockStore((state) => state.setLocked);

  // REFS HỨNG DỮ LIỆU THÔ TỪ SOCKET (TỐC ĐỘ CAO)
  const latestIdpsTrafficRef = useRef<any>(null);
  const latestIdpsPacketRef = useRef<any[] | null>(null);

  const connectSocket = (token: string) => {
    logger.info('SOCKET', 'Initiating WebSocket connections...'); 
    idpsSocket.auth = { token }; idpsSocket.connect();
    systemNotificationSocket.auth = { token }; systemNotificationSocket.connect();
  };

  const disconnectSocket = () => {
    logger.warn('SOCKET', 'Disconnecting WebSockets...'); 
    idpsSocket.disconnect();
    systemNotificationSocket.disconnect();
  };

  const resetIdpsStatistics = () => {
    idpsSocket.emit('reset_idps_statistics');
    useIdpsStore.getState().resetStats();
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) connectSocket(token);

    systemNotificationSocket.on("sys_notify", (payload: any) => {
      setLocked(false);
      window.dispatchEvent(new CustomEvent('SYS_NOTIFY_RECEIVED', { detail: payload }));
      window.dispatchEvent(new Event('FORCE_REFRESH_DATA'));
    });

    idpsSocket.on("connect", () => { setIsConnected(true); });
    idpsSocket.on("disconnect", () => { setIsConnected(false); });

    idpsSocket.on('idps_traffic_stats', (data: any) => { latestIdpsTrafficRef.current = data; });
    idpsSocket.on('idps_packet_logs', (packets: any[]) => { latestIdpsPacketRef.current = packets; });

    // ====================================================================
    // BỘ ĐIỀU TIẾT TRUNG TÂM (THROTTLING LOOP) - CHẠY ĐÚNG 1 GIÂY/LẦN
    // ====================================================================
    const throttleInterval = setInterval(() => {
      // Xử lý dữ liệu IDPS
      if (latestIdpsTrafficRef.current) {
        useIdpsStore.getState().updateIdpsData(latestIdpsTrafficRef.current);
        latestIdpsTrafficRef.current = null;
      }
      if (latestIdpsPacketRef.current) {
        useIdpsStore.getState().updateLogs(latestIdpsPacketRef.current);
        latestIdpsPacketRef.current = null;
      }
    }, 1000);

    return () => {
      clearInterval(throttleInterval);
      idpsSocket.removeAllListeners();
      systemNotificationSocket.removeAllListeners();
      disconnectSocket();
    };
  }, [setLocked]);

  // ====================================================================
  // [CẢI TIẾN QUAN TRỌNG]: DÙNG USEMEMO CHO CONTEXT VALUE
  // ====================================================================
  const contextValue = useMemo(() => ({
    systemNotificationSocket,
    isConnected,
    connectSocket,
    disconnectSocket,
    resetIdpsStatistics,
  }), [isConnected]);

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);