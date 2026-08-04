import React, { useEffect, useState } from 'react';
import { Switch, Segmented, Typography, Spin } from 'antd';
import styles from './idpsStatus.module.css';

const { Text } = Typography;

interface IdpsStatusProps {
  initialActive: boolean;
  initialMode: string;
  loading: boolean;
  onUpdate: (active: boolean, mode: string) => void;
}

const IdpsStatus: React.FC<IdpsStatusProps> = ({ initialActive, initialMode, loading, onUpdate }) => {
  const [isActive, setIsActive] = useState<boolean>(initialActive);
  const [mode, setMode] = useState<string>(initialMode);

  useEffect(() => {
    setIsActive(initialActive);
    setMode(initialMode);
  }, [initialActive, initialMode]);

  const handleToggle = (checked: boolean) => {
    const nextMode = checked ? 'ids' : mode;
    // Cập nhật UI ngay lập tức (Optimistic)
    setIsActive(checked);
    if (checked) setMode('ids');
    // Báo lên API
    onUpdate(checked, nextMode);
  };

  const handleModeChange = (val: string) => {
    setMode(val);
    onUpdate(isActive, val);
  };

  return (
    <Spin spinning={loading} size="small">
      <div className={`${styles.statusCard} ${isActive ? styles.statusCardActive : ''}`}>
        {/* <div className={styles.valueContainer}> */}

        {/* Phần 1: Label STATUS và Switch */}
        <div className={styles.statusHeader}>
          <Text className={styles.statusLabel}>Status</Text>
          <Switch
            checked={isActive}
            onChange={handleToggle}
            checkedChildren="ON"
            unCheckedChildren="OFF"
            disabled={loading}
          />
        </div>

        {/* Phần 2: Segmented chiếm toàn bộ chiều rộng (block) */}
        {isActive && (
          <div className={styles.controlRow}>
            <Segmented
              block
              className={styles.customSegmented}
              options={[
                { label: 'IDS', value: 'ids' },
                { label: 'IPS', value: 'ips' },
              ]}
              value={mode}
              onChange={(val) => handleModeChange(val as string)}
              disabled={loading}
            />
          </div>
        )}
      </div>
    </Spin>
  );
};

export default IdpsStatus;