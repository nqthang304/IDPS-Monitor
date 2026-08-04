
import React from 'react';
import { Tabs } from "antd";
import styles from './logs.module.css';

import PageTitle from '@/application/layout/pageTitle/pageTitle';
import LogSetting from "@/features/modules/management/logs_page/logSetting/logSetting";
import IDPSLogs from "@/features/modules/management/logs_page/idpsLog/idpsLog";
import SystemLog from "@/features/modules/management/logs_page/systemLog/systemLog";

const Logs: React.FC = () => {
    return (
        <div className={styles.container}>
            <PageTitle
                title="Logs"
                description="View and manage your device activities and setting logs"
            />
            <Tabs
                tabPlacement="start"
                items={[
                    {
                        key: "logSettings",
                        label: "Log setting",
                        children: (
                            <LogSetting />
                        ),
                    },
                    {
                        key: "idpsLogs",
                        label: "IDPS logs",
                        children: <IDPSLogs />,
                    },
                    {
                        key: "deviceLogs",
                        label: "System activity",
                        children: <SystemLog />,
                    },
                ]}>
            </Tabs>
        </div>
    );
}

export default Logs;