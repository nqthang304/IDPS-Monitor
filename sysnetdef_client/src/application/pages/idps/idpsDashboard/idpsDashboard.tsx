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
import { useIdpsStore } from '@/features/modules/idps/dashboard_page/store/idpsStore';

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
      const active = res.data?.active ?? false;
      const mode = res.data?.mode ?? 'ids';
      setIdpsData({ active, mode });
      useIdpsStore.getState().setStatus(active, mode);
      setRefreshKey(Date.now());
    } catch (error) {
      console.error("Lỗi lấy status:", error);
    } finally {
      isLoading(false);
    }
  };

  useEffect(() => {
    const handleForceRefresh = () => {
      fetchStatus();
    };

    window.addEventListener('FORCE_REFRESH_DATA', handleForceRefresh);
    handleForceRefresh();

    return () => {
      window.removeEventListener('FORCE_REFRESH_DATA', handleForceRefresh);
    };
  }, []);

  const handleIdpsUpdate = async (active: boolean, mode: string) => {
    if (useLockStore.getState().isLocked) return;

    // Cập nhật ngay vào local state và store (Optimistic Update)
    setIdpsData({ active, mode: mode as IdpsMode });
    useIdpsStore.getState().setStatus(active, mode as IdpsMode);

    try {
      await idpsApi.updateIdpsStatus({ active, mode: mode as IdpsMode });
      // Không gọi fetchStatus() ngay tại đây vì WebSocket event 'FORCE_REFRESH_DATA'
      // sẽ tự động gọi fetchStatus() sau khi Backend đã cập nhật Database xong!
    } catch (error: any) {
      // Chỉ fetchStatus() lại khi API có lỗi để rollback về trạng thái cũ
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