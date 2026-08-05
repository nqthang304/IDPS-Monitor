import React, { useRef, useState, useEffect } from 'react';
import { Modal, Button, Spin } from 'antd';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import styles from './exportReportModal.module.css';

import AnalyzeActionChart from '@/features/modules/shared/analyze_page/analyzeActionChart/analyzeActionChart';
import AnalyzePieChart from '@/features/modules/shared/analyze_page/analyzePieChart/analyzePieChart';
import TopIPTable from '@/features/modules/shared/analyze_page/topIPTable/topIPTable';

import type { AnalyzeTrafficResponse } from '@/features/types/idps.type';
import type { ColoredTopIPEntry } from '@/application/pages/idps/idpsAnalyze/idpsAnalyze';
import { bitFormatter, byteFormatter } from '@/utils/formatter.utils';
import logo from '@/assets/Logo/ACS_Logo.svg';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    data: AnalyzeTrafficResponse | null;
    startTime: string;
    endTime: string;
    moduleType?: 'ddos' | 'idps';
}

// Định nghĩa cấu trúc hàng chung cho bảng summary
interface SummaryRowData {
    label: string;
    totalBytes: number;
    avgBitrate: number;
    peakBitrate: number;
}

const ExportReportModal: React.FC<Props> = ({ isOpen, onClose, data, startTime, endTime, moduleType = 'idps' }) => {
    const reportRef = useRef<HTMLDivElement>(null);
    const [isChartVisible, setIsChartVisible] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const isDDoS = moduleType === 'ddos';

    useEffect(() => {
        if (!isOpen) setIsChartVisible(false);
    }, [isOpen]);

    // Hàm chuyển đổi dữ liệu thô từ API thành mảng hàng động dựa theo Module hiện tại
    const getSummaryRowsData = (): SummaryRowData[] => {
        if (!data) return [];

        const rows: SummaryRowData[] = [
            {
                label: 'Traffic processed',
                totalBytes: data.totalProcessedBytes ?? 0,
                avgBitrate: data.avgProcessedBitrate ?? 0,
                peakBitrate: data.peakProcessedBitrate ?? 0,
            },
            {
                label: 'Normal',
                totalBytes: data.stats?.normal?.totalBytes ?? 0,
                avgBitrate: data.stats?.normal?.avgBitrate ?? 0,
                peakBitrate: data.stats?.normal?.peakBitrate ?? 0,
            },
            {
                label: 'Alert',
                totalBytes: data.stats?.alert?.totalBytes ?? 0,
                avgBitrate: data.stats?.alert?.avgBitrate ?? 0,
                peakBitrate: data.stats?.alert?.peakBitrate ?? 0,
            },
            {
                label: 'Drop',
                totalBytes: data.stats?.drop?.totalBytes ?? 0,
                avgBitrate: data.stats?.drop?.avgBitrate ?? 0,
                peakBitrate: data.stats?.drop?.peakBitrate ?? 0,
            }
        ];

        return rows;
    };

    const handleDownloadPDF = async () => {
        if (!reportRef.current) return;
        setIsExporting(true);

        try {
            const sectionIds = ['pdf-header', 'pdf-summary', 'pdf-action-chart', 'pdf-source-ip', 'pdf-dest-ip', 'pdf-pie-chart'];

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 10;
            let currentY = margin;

            for (let i = 0; i < sectionIds.length; i++) {
                const element = document.getElementById(sectionIds[i]);
                if (!element) continue;

                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: "#ffffff",
                });

                const imgData = canvas.toDataURL('image/png');
                const imgWidth = pageWidth - (margin * 2);
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                if (currentY + imgHeight > pageHeight - margin) {
                    pdf.addPage();
                    currentY = margin;
                }

                pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
                currentY += imgHeight + 5;
            }

            pdf.save(`${moduleType.toUpperCase()}_Report_${Date.now()}.pdf`);
        } catch (error) {
            console.error("PDF Export Error:", error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Modal
            title="Preview report"
            open={isOpen}
            onCancel={onClose}
            width={1000}
            afterOpenChange={(open) => {
                if (open) setTimeout(() => setIsChartVisible(true), 300);
            }}
            footer={[
                <Button key="cancel" onClick={onClose}>Cancel</Button>,
                <Button
                    key="download"
                    type="primary"
                    onClick={handleDownloadPDF}
                    disabled={!isChartVisible}
                    loading={isExporting}
                >
                    {isExporting ? 'Processing...' : 'Download PDF'}
                </Button>
            ]}
        >
            <div ref={reportRef} className={styles.reportContainer}>
                {/* 1. Header */}
                <div id="pdf-header" className={styles.pdfSection}>
                    <div className={styles.header}>
                        <div className={styles.title}>
                            <h1>{isDDoS ? 'DDoS' : 'IDPS'} analytics report</h1>
                            <p>From: <strong>{startTime}</strong> to: <strong>{endTime}</strong></p>
                        </div>
                        <img src={logo} alt="Logo" className={styles.logo} />
                    </div>
                </div>

                {/* 2. Summary Table - ĐÃ THAY ĐỔI THÀNH VÒNG LẶP ĐỘNG */}
                <div id="pdf-summary" className={styles.pdfSection}>
                    <h3>Sysnetdef traffic summary</h3>
                    <table className={styles.summaryTable}>
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Total</th>
                                <th>Average</th>
                                <th>Peak</th>
                            </tr>
                        </thead>
                        <tbody>
                            {getSummaryRowsData().map((row) => (
                                <tr key={row.label}>
                                    <td>{row.label}</td>
                                    <td>{byteFormatter(row.totalBytes)}</td>
                                    <td>{bitFormatter(row.avgBitrate)}/s</td>
                                    <td>{bitFormatter(row.peakBitrate)}/s</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 3. Traffic Chart */}
                <div id="pdf-action-chart" className={styles.pdfSection}>
                    <div className={styles.chartSection}>
                        <h3>Traffic chart</h3>
                        <div className={styles.chartWrapper}>
                            {isChartVisible ? (
                                <AnalyzeActionChart
                                    data={data?.timeSeriesData || []}
                                    isExportMode={true}
                                    moduleType={moduleType}
                                />
                            ) : (
                                <div className={styles.chartPlaceholder}><Spin /></div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. Top Source IPs */}
                <div id="pdf-source-ip" className={styles.pdfSection}>
                    <div className={styles.tableSection}>
                        <h3>Top source IP addresses</h3>
                        <TopIPTable data={(data?.topSourceIps || []) as ColoredTopIPEntry[]} />
                    </div>
                </div>

                {/* 5. Top Destination IPs */}
                <div id="pdf-dest-ip" className={styles.pdfSection}>
                    <div className={styles.tableSection}>
                        <h3>Top destination IP addresses</h3>
                        <TopIPTable data={(data?.topDestinationIps || []) as ColoredTopIPEntry[]} />
                    </div>
                </div>

                {/* 6. Trends Section */}
                <div id="pdf-pie-chart" className={styles.pdfSection}>
                    <div className={styles.chartSection}>
                        <h3>Traffic trends</h3> (
                        <div className={styles.pieWrapper}>
                            {isChartVisible ? (
                                <AnalyzePieChart
                                    summaryByProtocol={(data as AnalyzeTrafficResponse)?.protocolBreakdown || {}}
                                    moduleType={moduleType}
                                    isExport={true}
                                />
                            ) : (
                                <div className={styles.chartPlaceholder}><Spin /></div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ExportReportModal;