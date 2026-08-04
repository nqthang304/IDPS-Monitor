import React, { useEffect, useState } from 'react';
import { Col, Row, message } from 'antd';
import LogUsage from './components/logUsage/logUsage';
import LogsRetention from './components/logsRetention/logsRetention';
import ActivitySettings from './components/activitySettings/activitySettings';
import styles from './LogSetting.module.css'; // Import module css
import { logApi } from '../../services/api/management.api';
import type { logUsage, logsRetention, activitySettings } from '@/features/types/logs.type';

const LogSetting: React.FC = () => {
    const [usageData, setUsageData] = useState<logUsage | undefined>(undefined);
    const [retentionData, setRetentionData] = useState<any>(undefined);
    const [activitySettingsData, setActivitySettingsData] = useState<any>(undefined);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const fetchLogsUsage = async () => {
        try {
            setIsLoading(true);
            const response = await logApi.getLogsUsage();
            console.log("Check API Response:", response);
            setUsageData(response.data);
        } catch (error: any) {
            console.error("Fetch error:", error);
            const errorMsg = error.response?.data?.message || "Lỗi kết nối server (404/500)";
            message.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };
    const fetchLogsRetention = async () => {
        try {
            setIsLoading(true);
            const response = await logApi.getLogsRetention();
            if (response.success) {
                setRetentionData(response.data);
                console.log("Fetched logs retention data:", response.data); // Debug log
            }
        } catch (error) {
            console.error("Failed to fetch logs retention:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchActivitySettings = async () => {
        try {
            setIsLoading(true);
            const response = await logApi.getActivitySettings();
            if (response.success) {
                setActivitySettingsData(response.data);
                console.log("Fetched activity settings data:", response.data);
            }
        } catch (error) {
            console.error("Failed to fetch activity settings:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogsUsage();
        fetchLogsRetention();
        fetchActivitySettings();
    }, []);

    const handleUpdateRetention = async (params: logsRetention) => {
        try {
            const response = await logApi.updateLogsRetention(params);
            if (response.success) {
                message.success("Logs retention updated!");
                setRetentionData(params); // Cập nhật lại state local
            }
        } catch (error) {
            message.error("Failed to update retention");
        }
    };

    // Hàm xử lý lưu Activity
    const handleUpdateActivity = async (params: activitySettings) => {
        try {
            const response = await logApi.updateActivitySettings(params);
            if (response.success) {
                message.success("Activity settings updated!");
                setActivitySettingsData(params); // Cập nhật lại state local
            }
        } catch (error) {
            message.error("Failed to update activity settings");
        }
    };

    return (
        <div className={styles.container}>
            {/* Phần Log Usage */}
            <div className={styles.section}>
                <div className={styles.sectionTitle}>Log usage</div>
                <LogUsage data={usageData} loading={isLoading} />
            </div>

            {/* Phần Settings dưới dạng hàng */}
            <div className={styles.section}>
                <Row gutter={16} className={styles.equalHeightRow}>
                    {/* Cột Logs Retention */}
                    <Col span={12} className={styles.flexCol}>
                        <div className={styles.sectionTitle}>Logs retention</div>
                        <div className={styles.componentWrapper}>
                            <LogsRetention data={retentionData} onSave={handleUpdateRetention} />
                        </div>
                    </Col>

                    {/* Cột Activity Settings */}
                    <Col span={12} className={styles.flexCol}>
                        <div className={styles.sectionTitle}>Activity Settings</div>
                        <div className={styles.componentWrapper}>
                            <ActivitySettings data={activitySettingsData} onSave={handleUpdateActivity} />
                        </div>
                    </Col>
                </Row>
            </div>
        </div>
    );
}

export default LogSetting;