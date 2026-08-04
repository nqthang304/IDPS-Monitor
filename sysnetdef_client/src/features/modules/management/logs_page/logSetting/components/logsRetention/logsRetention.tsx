import React, { useState, useMemo, useEffect } from 'react';
import { Button, Slider, Switch, InputNumber } from 'antd';
import styles from './logsRetention.module.css';
import type { logsRetention } from '@/features/types/logs.type';

interface LogRetentionProps {
    data: logsRetention;
    onSave: (data: any) => void;
}

const LogRetention: React.FC<LogRetentionProps> = ({ data, onSave}) => {
    const [usageLimit, setUsageLimit] = useState(data?.usageLimit ?? 0 );
    const [autoClean, setAutoClean] = useState(data?.autoClean ?? false);

    useEffect(() => {
        if (data) {
            setUsageLimit(data.usageLimit);
            setAutoClean(data.autoClean);
        }
    }, [data]);

    const isChanged = useMemo(() => {
        return (
            usageLimit !== (data?.usageLimit ?? 0) ||
            autoClean !== (data?.autoClean ?? false)
        );
    }, [usageLimit, autoClean, data]);

    const handleInternalSave = () => {
        if (isChanged) {
            onSave({ usageLimit, autoClean });
        }
    };

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <h3 className={styles.title}>Network logs retention</h3>
                <Button 
                    type="primary" 
                    className={isChanged ? styles.saveBtn : styles.saveBtnDisabled}
                    onClick={handleInternalSave}
                    disabled={!isChanged}
                >
                    Save
                </Button>
            </div>

            <div className={styles.sliderContainer}>
                <Slider 
                    value={usageLimit} 
                    onChange={(val) => setUsageLimit(val)}
                    tooltip={{ 
                        formatter: (value) => `${value}%`,
                        placement: 'top'
                    }}
                    trackStyle={{ backgroundColor: '#d9d9d9' }}
                    handleStyle={{ borderColor: '#d9d9d9', backgroundColor: '#fff' }}
                />
                <div className={styles.sliderLabels}>
                    <span>0%</span>
                    <span>100%</span>
                </div>
            </div>

            <div className={styles.settingRow}>
                <span className={styles.label}>Logs usage limit</span>
                <div className={styles.inputGroup}>
                    <InputNumber 
                        className={styles.pillInput} 
                        value={usageLimit}
                        min={0}
                        max={100}
                        onChange={(val) => setUsageLimit(val || 0)}
                        controls={false} 
                    />
                    <span className={styles.label}>%</span>
                </div>
            </div>

            <div className={styles.settingRow}>
                <span className={styles.label}>Auto clean logs</span>
                <Switch 
                    checked={autoClean} 
                    onChange={(checked) => setAutoClean(checked)}
                    style={{ backgroundColor: autoClean ? '#49cc19' : undefined }}
                />
            </div>
        </div>
    );
};

export default LogRetention;