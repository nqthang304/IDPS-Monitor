import React, { useEffect, useState, useMemo } from 'react';
import { Button, Switch, InputNumber } from 'antd';
import styles from './ActivitySettings.module.css';
import type { activitySettings } from '@/features/types/logs.type';
interface ActivitySettingsProps {
    data: activitySettings | undefined;
    onSave: (data: any) => void;
}

const ActivitySettings: React.FC<ActivitySettingsProps> = ({ data, onSave }) => {
    // 1. Khai báo State
    const [autoClean, setAutoClean] = useState(data?.cleanActive ?? false);
    const [days, setDays] = useState(data?.cleanTime ?? 30);

    useEffect(() => {
        if (data) {
            setAutoClean(data.cleanActive);
            setDays(data.cleanTime);
        }
    }, [data]);

    // 2. Kiểm tra xem dữ liệu có thay đổi không
    const isChanged = useMemo(() => {
        return (
            autoClean !== (data?.cleanActive ?? false) ||
            days !== (data?.cleanTime ?? 30)
        );
    }, [autoClean, days, data]);

    // 3. Hàm xử lý khi bấm Save
    const handleSave = () => {
        if (isChanged) {
            onSave({
                cleanActive: autoClean,
                cleanTime: days
            });
        }
    };

    return (
        <div className={styles.card}>
            {/* Header: Title + Button */}
            <div className={styles.header}>
                <h3 className={styles.title}>Activity Settings</h3>
                <Button
                    type="primary"
                    className={isChanged ? styles.saveBtn : styles.saveBtnDisabled}
                    onClick={handleSave}
                    disabled={!isChanged}
                >
                    Save
                </Button>
            </div>

            {/* Row 1: Auto clean active */}
            <div className={styles.settingRow}>
                <span className={styles.label}>Auto clean active</span>
                <div className={styles.greenSwitch}>
                    <Switch
                        checked={autoClean}
                        onChange={(checked) => setAutoClean(checked)}
                    />
                </div>
            </div>

            {/* Row 2: Clean activity older than */}
            <div className={styles.settingRow}>
                <span className={styles.label}>Clean activity older than</span>
                <div className={styles.controlGroup}>
                    <InputNumber
                        min={1}
                        max={365}
                        value={days}
                        onChange={(val) => setDays(val || 1)}
                        className={styles.pillInput}
                        controls={false} // Ẩn nút tăng giảm để giống hình mẫu
                    />
                    <span className={styles.label}>day</span>
                </div>
            </div>
        </div>
    );
};

export default ActivitySettings;