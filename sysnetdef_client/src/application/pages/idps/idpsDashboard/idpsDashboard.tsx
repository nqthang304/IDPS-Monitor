import React, { useEffect, useState } from 'react';
import { Row, Col } from 'antd';
import styles from './IdpsDashboard.module.css';

import type { IdpsMode } from '@/features/types/idps.type';
import { idpsApi } from '@/features/modules/idps/services/api/idps.api';

import IdpsStatus from '@/features/modules/idps/dashboard_page/components/idpsStatus/idpsStatus';
import IdpsIncomingPps from '@/features/modules/idps/dashboard_page/components/idpsIncomingPps/idpsIncomingPps';
import IdpsTotalPacket from '@/features/modules/idps/dashboard_page/components/idpsTotalPacket/idpsTotalPacket';
import IdpsAreaChart from '@/features/modules/idps/dashboard_page/components/idpsAreaChart/idpsAreaChart';
import IdpsLogs from '@/features/modules/idps/dashboard_page/components/idpsLog/idpsLog';
import IdpsPieChart from '@/features/modules/idps/dashboard_page/components/idpsPieChart/idpsPieChart';
import IdpsActiveRule from '@/features/modules/idps/dashboard_page/components/idpsActiveRule/idpsActiveRule';

// Import Store quản lý Lock mới
import { useLockStore } from '@/system/stores/useLockStore';

const IdpsDashboard: React.FC = () => {
  const [loading, isLoading] = useState(false);
  const [idpsData, setIdpsData] = useState<{ active: boolean; mode: IdpsMode }>({
    active: false,
    mode: 'ids'
  });
  // const [activeRuleCount, setActiveRuleCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(Date.now());

  // Lấy trạng thái khóa từ Global Store
  const { isLocked } = useLockStore();

  const fetchStatus = async () => {
    isLoading(true);
    try {
      const res = await idpsApi.getIdpsStatus();
      console.log("IDPS Status Response:", res);
      setIdpsData({ 
        active: res.data?.active ?? false, 
        mode: res.data?.mode ?? 'ids' 
      });
      setRefreshKey(Date.now());
    } catch (error) {
      console.error("Lỗi lấy status:", error);
    } finally {
      isLoading(false);
    }
  };

  // const fetchActiveRuleCount = async () => {
  //   try {
  //     const res = await idpsApi.getIdpsActiveRuleCount();
  //     console.log("IDPS Active Rule Count Response:", res);
  //     setActiveRuleCount(res.count);
  //   } catch (error) {
  //     console.error("Lỗi lấy active rule count:", error);
  //   }
  // };

  useEffect(() => {
    const handleForceRefresh = () => {
      fetchStatus();
      // fetchActiveRuleCount();
    };

    window.addEventListener('FORCE_REFRESH_DATA', handleForceRefresh);
    handleForceRefresh();

    return () => {
      window.removeEventListener('FORCE_REFRESH_DATA', handleForceRefresh);
    };
  }, []);

  const handleIdpsUpdate = async (active: boolean, mode: string) => {
    // 1. Chặn ngay từ UI nếu đang khóa (Interceptor axios cũng chặn, nhưng chặn ở đây giúp tiết kiệm 1 luồng gọi)
    if (useLockStore.getState().isLocked) return;

    try {
      // 2. Gọi API. 
      // Nếu là 202 (Đang xử lý) hoặc 200 (Thành công), sự kiện API_NOTIFY đã được bắn ra từ axiosClient 
      // và NotificationHandler sẽ tự động hiện thông báo tương ứng.
      await idpsApi.updateIdpsStatus({ active, mode: mode as IdpsMode });
      
      // Đồng bộ lại UI (đảm bảo hiển thị đúng trạng thái)
      fetchStatus();
    } catch (error: any) {
      // 3. Nếu là lỗi 503, 400, 500,... axiosClient đã ném Promise.reject 
      // và bắn sự kiện API_NOTIFY báo lỗi. Bạn không cần tự viết notification.error() nữa.
      // Chỉ cần fetch lại dữ liệu gốc để Switch button hoặc các trạng thái trả về như cũ
      fetchStatus();
    }
  };

  return (
    <div className={styles.container}>
      {/* 2. Stat Cards Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <IdpsStatus
            key={refreshKey}
            initialActive={idpsData.active}
            initialMode={idpsData.mode}
            // Component con sẽ bị disable khi loading hoặc hệ thống bị khóa
            loading={loading || isLocked}
            onUpdate={handleIdpsUpdate}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <IdpsActiveRule />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <IdpsIncomingPps />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <IdpsTotalPacket />
        </Col>
      </Row>

      {/* 3. Charts Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <IdpsPieChart />
        </Col>
        <Col xs={24} lg={16}>
          <IdpsAreaChart />
        </Col>
      </Row>

      {/* 4. Log Table Row */}
      <Row>
        <Col span={24}>
          <IdpsLogs />
        </Col>
      </Row>
    </div>
  );
};

export default IdpsDashboard;