import React from 'react';
import styles from './idpsTotalPacket.module.css';
import { ProjectOutlined } from '@ant-design/icons';
import { cntFormatter } from "@/utils/formatter.utils";
import { useIdpsStore } from '@/features/modules/idps/dashboard_page/store/idpsStore';

const IdpsTotalPacket: React.FC = () => {
  const summary = useIdpsStore((state) => state.summary);
  const totalValue = summary.totalPackets || 0;
  return (
    <div className={styles.totalCard}>
      <h3 className={styles.title}>Total packets</h3>
      <div className={styles.valueContainer}>
        <span>
          <ProjectOutlined className={styles.icon} />
        </span>
        <span className={styles.value} title={totalValue.toLocaleString()}>
          {cntFormatter(totalValue)}
        </span>
      </div>
    </div>
  );
};

export default IdpsTotalPacket;