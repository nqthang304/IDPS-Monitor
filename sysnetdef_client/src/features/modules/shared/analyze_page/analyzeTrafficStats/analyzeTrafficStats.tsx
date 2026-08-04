import React from 'react';
import { Typography, Row, Col, Divider, Spin } from 'antd';
import styles from './analyzeTrafficStats.module.css';
import { byteFormatter, bitFormatter } from '@/utils/formatter.utils';

const { Text, Title } = Typography;

interface Props {
    totalProcessedBytes: number;
    startTime: string;
    endTime: string;
    loading?: boolean;
    rowsData: { // Mảng dữ liệu cho từng loại traffic
        label: string;
        totalBytes: number;
        avgBitrate: number;
        peakBitrate: number;
    }[];
}

const calculateDuration = (start: string, end: string): string => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const durationMs = Math.abs(endTime - startTime);
    const totalSeconds = Math.floor(durationMs / 1000);
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    return `${days} days, ${hours} hours`;
};

const AnalyzeTrafficStats: React.FC<Props> = ({ totalProcessedBytes, rowsData, startTime, endTime, loading }) => {
    return (
        loading ? (
            <div className={styles.loadingContainer}><Spin size="large" /></div>
        ) : (
            <div className={styles.container}>
                <div className={styles.headerSection}>
                    <Title level={5} className={styles.mainTitle}>Traffic processed</Title>
                    <div className={styles.totalInfo}>
                        <Text strong className={styles.totalByteText}>{byteFormatter(totalProcessedBytes)}</Text>
                        <Text className={styles.durationLabel}>in </Text>
                        <Text strong className={styles.durationValue}>{calculateDuration(startTime, endTime)}</Text>
                    </div>
                </div>
                <Divider className={styles.divider} />
                
                {rowsData?.map((row) => (
                    <div className={styles.statSection} key={row.label}>
                        <Title level={5} className={styles.rowTitle}>{row.label}</Title>
                        <Row gutter={16} align="middle">
                            <Col span={8}>
                                <Text strong className={styles.byteText}>{byteFormatter(row.totalBytes)}</Text>
                            </Col>
                            <Col span={8}>
                                <Text className={styles.labelSecondary}>Avg:</Text>
                                <Text className={styles.valueBold}>{bitFormatter(row.avgBitrate)}/s</Text>
                            </Col>
                            <Col span={8}>
                                <Text className={styles.labelSecondary}>Peak:</Text>
                                <Text className={styles.valueBold}>{bitFormatter(row.peakBitrate)}/s</Text>
                            </Col>
                        </Row>
                    </div>
                ))}
            </div>
        )
    );
};

export default AnalyzeTrafficStats;