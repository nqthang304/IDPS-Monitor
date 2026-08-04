import React from 'react';
import { Button, Col, Flex, Row, Space, Typography } from 'antd';
import { ClockCircleOutlined, FormOutlined } from '@ant-design/icons';
import PageTitle from '@/application/layout/pageTitle/pageTitle';
import styles from './idpsAnalyze.module.css';

import { idpsApi } from '@/features/modules/idps/services/api/idps.api';
import type { AnalyzeTrafficResponse, TopIPEntry } from '@/features/types/idps.type';

import TimeSelectModal from '@/features/modules/shared/analyze_page/timeSelectModal/timeSelectModal';
import AnalyzePieChart from '@/features/modules/shared/analyze_page/analyzePieChart/analyzePieChart';
import AnalyzeActionChart from '@/features/modules/shared/analyze_page/analyzeActionChart/analyzeActionChart';
import AnalyzeTrafficStats from '@/features/modules/shared/analyze_page/analyzeTrafficStats/analyzeTrafficStats';
import TopIPTable from '@/features/modules/shared/analyze_page/topIPTable/topIPTable';
import TopIPChart from '@/features/modules/shared/analyze_page/topIPChart/topIPChart';
import ExportReportModal from '@/features/modules/shared/analyze_page/exportReportModal/exportReportModal';

const { Text } = Typography;

// 1. Định nghĩa bảng màu cố định cho Top 5
const IP_COLOR_PALETTE = [
    '#1677ff', // Blue
    '#52c41a', // Green
    '#faad14', // Gold
    '#ff4d4f', // Red
    '#722ed1', // Purple
];

// Định nghĩa kiểu dữ liệu có kèm màu để các component con sử dụng
export interface ColoredTopIPEntry extends TopIPEntry {
    renderColor: string;
}


const IdpsAnalyze: React.FC = () => {
    const [isTimeModalOpen, setIsTimeModalOpen] = React.useState(true);
    const [startTime, setStartTime] = React.useState('2024-01-01 00:00:00');
    const [endTime, setEndTime] = React.useState('2024-01-07 23:59:59');
    const [loading, setLoading] = React.useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = React.useState(false);

    // Cấu trúc lại State để chứa dữ liệu đã được gán màu và lọc top 5
    const [analyzeData, setAnalyzeData] = React.useState<
        Omit<AnalyzeTrafficResponse, 'topSourceIps' | 'topDestinationIps'> & {
            topSourceIps: ColoredTopIPEntry[];
            topDestinationIps: ColoredTopIPEntry[];
        } | null
    >(null);

    // 2. Hàm xử lý: Lọc 5 phần tử đầu và gán màu
    const processTopIps = (ips: TopIPEntry[]): ColoredTopIPEntry[] => {
        if (!ips) return [];
        return ips.slice(0, 5).map((ip, index) => ({
            ...ip,
            renderColor: IP_COLOR_PALETTE[index] || '#8c8c8c',
        }));
    };

    const fetchAllData = async (start: string, end: string) => {
        setLoading(true);
        try {
            console.log(`Fetching analyze data from ${start} to ${end}`);
            const response = await idpsApi.getAnalyzeData(start, end);
            console.log('Fetched analyze data:', response);
            // Cập nhật state với dữ liệu đã qua xử lý
            if (response && response.success && response.data) {
                const { data } = response; // data chính là kiểu AnalyzeTrafficResponse

                setAnalyzeData({
                    ...data, // Trải các thuộc tính stats, totalProcessedBytes... từ data thực tế
                    topSourceIps: processTopIps(data.topSourceIps), // Lấy từ data thay vì response
                    topDestinationIps: processTopIps(data.topDestinationIps), // Lấy từ data thay vì response
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleGetTimeRange = (timeRange: [string, string]) => {
        console.log('Selected time range:', timeRange);
        const [start, end] = timeRange;
        setStartTime(start);
        setEndTime(end);
        void fetchAllData(start, end);
        setIsTimeModalOpen(false);
    }

    const idpsRowsData = [
        {
            label: 'Normal',
            totalBytes: analyzeData?.stats?.normal?.totalBytes || 0,
            avgBitrate: analyzeData?.stats?.normal?.avgBitrate || 0,
            peakBitrate: analyzeData?.stats?.normal?.peakBitrate || 0,
        },
        {
            label: 'Drop',
            totalBytes: analyzeData?.stats?.drop?.totalBytes || 0,
            avgBitrate: analyzeData?.stats?.drop?.avgBitrate || 0,
            peakBitrate: analyzeData?.stats?.drop?.peakBitrate || 0,
        },
        {
            label: 'Alert',
            totalBytes: analyzeData?.stats?.alert?.totalBytes || 0,
            avgBitrate: analyzeData?.stats?.alert?.avgBitrate || 0,
            peakBitrate: analyzeData?.stats?.alert?.peakBitrate || 0,
        },
    ];

    return (
        <div className={isTimeModalOpen ? styles.containerChangeTime : styles.container} >
            {/* Header */}
            <Flex justify="space-between" align="center" className={styles.header}>
                <Space orientation="vertical" size={0}>
                    <PageTitle title="IDPS analyze" />
                    <div className={styles.timeRange}>
                        <Text type="secondary">From: </Text> <Text strong>{startTime}</Text>
                        <Text type="secondary"> To: </Text> <Text strong>{endTime}</Text>
                    </div>
                </Space>

                <Space size="middle">
                    <Button
                        icon={<ClockCircleOutlined />}
                        className={styles.btnChangeTime}
                        onClick={() => setIsTimeModalOpen(true)}
                    >
                        Change time
                    </Button>
                    <Button type="primary" icon={<FormOutlined />} className={styles.btnExport} onClick={() => setIsExportModalOpen(true)} disabled={loading}>
                        Export result
                    </Button>
                </Space>
            </Flex>

            {/* Content Row 1: Sysnetdef Traffic */}
            <div className={styles.card}>
                <div className={styles.cardTitle}>Sysnetdef traffic</div>
                <Row gutter={16} className={styles.cardBody}>
                    <Col span={8}>
                        <AnalyzeTrafficStats
                            totalProcessedBytes={analyzeData?.totalProcessedBytes || 0}
                            rowsData={idpsRowsData}
                            startTime={startTime}
                            endTime={endTime}
                            loading={loading}
                        />
                    </Col>
                    <Col span={16}>
                        <AnalyzeActionChart
                            data={analyzeData?.timeSeriesData || []}
                            isExportMode={isExportModalOpen}
                            loading={loading}
                        />
                    </Col>
                </Row>
            </div>

            {/* Content Row 2: Bottom Section */}
            <Row gutter={[16, 16]} className={styles.bottomRow}>
                <Col span={18}>
                    <Flex vertical gap={4} style={{ height: '100%' }}>
                        {/* Top Source */}
                        <div className={styles.card} >
                            <div className={styles.cardTitle}>Top source IP address</div>
                            <Row gutter={16} className={styles.cardBody}>
                                <Col span={14}>
                                    <TopIPChart
                                        data={analyzeData?.topSourceIps || []}
                                        loading={loading}
                                    />
                                </Col>
                                <Col span={10}>
                                    <TopIPTable
                                        data={analyzeData?.topSourceIps || []}
                                        loading={loading}
                                    />
                                </Col>
                            </Row>
                        </div>
                        {/* Top Destination */}
                        <div className={styles.card} >
                            <div className={styles.cardTitle}>Top destination IP address</div>
                            <Row gutter={16} className={styles.cardBody}>
                                <Col span={14}>
                                    <TopIPChart
                                        data={analyzeData?.topDestinationIps || []}
                                        loading={loading}
                                    />
                                </Col>
                                <Col span={10}>
                                    <TopIPTable
                                        data={analyzeData?.topDestinationIps || []}
                                        loading={loading}
                                    />
                                </Col>
                            </Row>
                        </div>
                    </Flex>
                </Col>

                {/* Right Column: Traffic Trends */}
                <Col span={6}>
                    <div className={`${styles.card} ${styles.fullHeight}`}>
                        <div className={styles.cardTitle}>Traffic trends</div>
                        <div className={styles.cardBody}>
                            <AnalyzePieChart
                                summaryByProtocol={analyzeData?.protocolBreakdown || { tcp: 0, udp: 0, icmp: 0 }}
                                loading={loading}
                            />
                        </div>
                    </div>
                </Col>
            </Row>

            <TimeSelectModal
                isModalOpen={isTimeModalOpen}
                onAnalyze={handleGetTimeRange}
            />
            <ExportReportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                data={analyzeData as any} // Cast nhẹ vì types đã thay đổi
                startTime={startTime}
                endTime={endTime}
            />
        </div>
    );
}

export default IdpsAnalyze;