import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Empty, Spin, theme as antdTheme } from 'antd';
import type { CustomThemeTokens } from "@/theme/themeConfig";
import type { ProtocolStats } from '@/features/types/idps.type';
import { bitFormatter } from '@/utils/formatter.utils';

interface AnalyzePieChartProps {
    summaryByProtocol: Record<string, number> | ProtocolStats | null | undefined;
    loading?: boolean;
    moduleType?: 'idps' | 'ddos';
    isExport?: boolean; 
}

const AnalyzePieChart: React.FC<AnalyzePieChartProps> = ({ summaryByProtocol, loading = false, moduleType = 'idps', isExport = false }) => {
    const { useToken } = antdTheme;
    const { token } = useToken();
    const theme = token as typeof token & CustomThemeTokens;

    const getProtocolColor = (key: string, index: number) => {
        const lowerKey = key.toLowerCase();
        const protocolColors: Record<string, string> = {
            // IDPS
            normal: theme.idpsNormal || '#07cc3b',
            alert: theme.idpsAlert || '#d8d823',
            drop: theme.idpsDrop || '#ff0808',

            // DDoS
            tcp: theme.tcpColor || '#1677ff',
            udp: theme.udpColor || '#52c41a',
            icmp: theme.icmpColor || '#faad14',
            http: theme.httpColor || '#eb2f96',
            dns: theme.dnsColor || '#13c2c2',
            esp: theme.espColor || '#722ed1',
            others: theme.unknownColor || '#979797',
            unknown: theme.unknownColor || '#979797',

            'syn flood': theme.synFloodColor || '#EE6666',
            'udp flood': theme.udpFloodColor || '#FC8452',
            'icmp flood': theme.icmpFloodColor || '#5470C6',
            'dns flood': theme.dnsFloodColor || '#91CC75',
            'http flood': theme.httpFloodColor || '#73C0DE',
            'ipsec ike': theme.ipsecColor || '#FFCD29',
            'tcp fragment': theme.tcpFragColor || '#9D1F1F',
            'udp fragment': theme.udpFragColor || '#F44C06',
            'land attack': theme.landColor || '#2FFF9E',
        };

        if (protocolColors[lowerKey]) return protocolColors[lowerKey];
        const palette = ['#722ed1', '#eb2f96', '#2f54eb', '#13c2c2', '#ff7a45', '#ffa940'];
        return palette[index % palette.length];
    };

    const chartData = useMemo(() => {
        if (!summaryByProtocol) return [];

        return Object.entries(summaryByProtocol)
            .filter(([_, value]) => value > 0)
            .map(([key, value], index) => ({
                name: key.toUpperCase(),
                value: value,
                itemStyle: { color: getProtocolColor(key, index) }
            }));
    }, [summaryByProtocol, theme]);

    const total = useMemo(() =>
        chartData.reduce((acc, curr) => acc + curr.value, 0),
        [chartData]);

    const option = useMemo(() => {
        return {
            tooltip: {
                trigger: 'item',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                textStyle: { color: '#333' },
                extraCssText: 'box-shadow: 0 2px 8px rgba(0,0,0,0.12); border-radius: 4px;',
                formatter: (params: any) => {
                    const isDDoSMode = moduleType === 'ddos';
                    const formattedValue = isDDoSMode
                        ? `${bitFormatter(params.value)}`
                        : `${params.value.toLocaleString()} pkts`;

                    return `
                        <div style="display: flex; align-items: center; gap: 8px;">
                            ${params.marker}
                            <span style="font-weight: 500;">${params.name}:</span>
                            <strong style="margin-left: auto; padding-left: 10px;">${formattedValue}</strong>
                            <span style="color: #888; font-size: 11px;">(${params.percent}%)</span>
                        </div>
                    `;
                }
            },
            legend: {
                type: isExport ? 'plain' : 'scroll',
                orient: 'horizontal',
                bottom: '0%',
                left: 'center',
                itemWidth: 10,
                itemHeight: 10,
                textStyle: {
                    fontSize: 10,
                    color: '#555'
                },
                pageButtonPosition: 'end',
                pageIconSize: 10,
            },
            grid: {
                left: '5%',
                right: '5%',
                top: '5%',
                bottom: '15%',
                containLabel: true
            },
            series: [
                {
                    name: 'Traffic distribution',
                    type: 'pie',
                    radius: ['0%', '75%'],
                    center: ['50%', '45%'],
                    avoidLabelOverlap: true,
                    itemStyle: { borderColor: '#fff', borderWidth: 2 },
                    label: {
                        show: true,
                        position: 'inside',
                        formatter: '{d}%',
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 'bold',
                    },
                    labelLine: { show: false },
                    data: chartData,
                },
            ],
        };
    }, [chartData, moduleType, theme, isExport]);

    return (
        <div style={{ width: '100%', height: '100%', minHeight: '180px' }}>
            {loading ? (
                <div style={{ height: '100%', display: 'grid', placeItems: 'center' }}><Spin size="large" /></div>
            ) : total === 0 ? (
                <div style={{ height: '100%', display: 'grid', placeItems: 'center' }}><Empty description="No traffic data" /></div>
            ) : (
                <ReactECharts option={option} style={{ height: '100%', width: '100%' }} notMerge={true} lazyUpdate={true} />
            )}
        </div>
    );
};

export default React.memo(AnalyzePieChart);