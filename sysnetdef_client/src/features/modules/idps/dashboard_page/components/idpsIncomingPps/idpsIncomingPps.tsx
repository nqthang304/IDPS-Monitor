import React from 'react';
import styles from './idpsIncomingPps.module.css';
import { LineChartOutlined } from '@ant-design/icons';
import { cntFormatter } from "@/utils/formatter.utils";
import { useIdpsStore } from '@/features/modules/idps/dashboard_page/store/idpsStore';

const IdpsIncomingPps: React.FC = () => {
  const onsecHistory = useIdpsStore((state) => state.onsecHistory);
  const latestData = onsecHistory[onsecHistory.length - 1];

  const totalPps = latestData?.totalPackets ?? 0;


  return (
    <div className={styles.ppsCard}>
      <h3 className={styles.title}>Incoming pps</h3>
      <div className={styles.valueContainer}>
        <span>
          <LineChartOutlined className={styles.icon} />
        </span>
        <span className={styles.value}>
          {cntFormatter(totalPps)}/s
        </span>
      </div>
    </div>
  );
};

export default IdpsIncomingPps;