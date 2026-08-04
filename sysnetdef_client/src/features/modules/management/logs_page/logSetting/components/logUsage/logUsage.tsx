import React from 'react';
import { Spin } from 'antd';
import styles from './LogUsage.module.css';
import type { logUsage } from '@/features/types/logs.type';
import { byteFormatter } from '@/utils/formatter.utils';

interface LogUsageProps {
    data?: logUsage; 
    loading?: boolean;
}

const LogUsage: React.FC<LogUsageProps> = ({ data, loading }) => {
    const displayData = [
        { label: "Total capacity", value: `${byteFormatter(data?.storageInfo?.total)}`, type: styles.valueCapacity },
        { label: "Used", value: `${byteFormatter(data?.storageInfo?.used)}`, type: styles.valueUsed },
        { label: "Usage", value: `${byteFormatter(data?.storageInfo?.free)}`, type: styles.valueFree },
        { label: "Total logs", value: data?.logsCount?.toLocaleString() || "0" + " logs", type: styles.valueLog },
        { label: "Total logs size", value: `${byteFormatter(data?.totalLogSize)}`, type: styles.valueLogSize },
    ];

    return (
        <Spin spinning={loading}>
            <div className={styles.rowContainer}>
                {displayData.map((item, index) => (
                    <div key={index} className={styles.statBox}>
                        <span className={styles.label}>{item.label}</span>
                        <p className={`${styles.value} ${item.type}`}>
                            {item.value}
                        </p>
                    </div>
                ))}
            </div>
        </Spin>
    );
};

export default LogUsage;