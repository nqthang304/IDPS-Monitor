import React, { useMemo, useRef, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { theme as antdTheme, Spin } from 'antd';
import type { CustomThemeTokens } from '@/theme/themeConfig';
import { timeFormatter, bitFormatter } from '@/utils/formatter.utils';
import { useResponsiveFont } from '@/hooks/useResponsiveFont';

interface ExtendedTrafficDataPoint {
    timestamp: number;
    normal: number;
    drop?: number;
    alert?: number;
    attack?: number; // Thuộc tính bổ sung của module DDoS
    [key: string]: any;
}


interface Props {
    data: ExtendedTrafficDataPoint[];
    loading?: boolean;
    isExportMode?: boolean;
    moduleType?: 'idps' | 'ddos';
}

const AnalyzeActionChart: React.FC<Props> = ({ data, isExportMode, loading, moduleType = 'idps' }) => {
    const { useToken } = antdTheme;
    const { token } = useToken();
    const theme = token as typeof token & CustomThemeTokens;
    const baseFontSize = useResponsiveFont();
    const chartRef = useRef<ReactECharts>(null);

    useEffect(() => {
        const resizeChart = () => {
            if (chartRef.current) {
                chartRef.current.getEchartsInstance().resize();
            }
        };
        const resizeObserver = new ResizeObserver(() => requestAnimationFrame(resizeChart));
        if (chartRef.current?.ele) {
            resizeObserver.observe(chartRef.current.ele.parentElement as Element);
        }
        return () => resizeObserver.disconnect();
    }, []);


    const option = useMemo(() => {
        const isDDoS = moduleType === 'ddos';
        const legendData = isDDoS ? ['Normal', 'Attack'] : ['Normal', 'Drop', 'Alert'];

        const colorPalette = isDDoS
            ? [theme.ddosNormal, theme.ddosAttack]
            : [theme.idpsNormal, theme.idpsDrop, theme.idpsAlert];

        const seriesData = [
            {
                name: 'Normal',
                type: 'line',
                stack: 'Total',
                smooth: true,
                showSymbol: false,
                sampling: 'lttb',
                lineStyle: { width: 0 },
                areaStyle: { opacity: 0.8, color: colorPalette[0] },
                data: data.map((item) => item.normal || 0),
            },
            ...(isDDoS
                ? [
                    {
                        name: 'Attack',
                        type: 'line',
                        stack: 'Total',
                        smooth: true,
                        showSymbol: false,
                        sampling: 'lttb',
                        lineStyle: { width: 0 },
                        areaStyle: { opacity: 0.8, color: colorPalette[1] },
                        data: data.map((item) => item.attack || 0),
                    }
                ]
                : [
                    {
                        name: 'Drop',
                        type: 'line',
                        stack: 'Total',
                        smooth: true,
                        showSymbol: false,
                        sampling: 'lttb',
                        lineStyle: { width: 0 },
                        areaStyle: { opacity: 0.8, color: colorPalette[1] },
                        data: data.map((item) => item.drop || 0),
                    },
                    {
                        name: 'Alert',
                        type: 'line',
                        stack: 'Total',
                        smooth: true,
                        showSymbol: false,
                        sampling: 'lttb',
                        lineStyle: { width: 0 },
                        areaStyle: { opacity: 0.8, color: colorPalette[2] },
                        data: data.map((item) => item.alert || 0),
                    }
                ]
            )
        ];


        return {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'line' },
                confine: true,
                formatter: (params: any[]) => {
                    if (!params || params.length === 0) return '';
                    const timestamp = params[0].name;

                    const fullTimeStr = timeFormatter(timestamp);

                    let res = `<div style="font-weight:bold; margin-bottom:5px;">${fullTimeStr}</div>`;
                    params.forEach(item => {
                        const formattedValue = isDDoS ? bitFormatter(item.value) : item.value.toLocaleString() + ' pkts';
                        res += `
                            <div style="display:flex; justify-content:space-between; gap:20px;">
                                <span>${item.marker} ${item.seriesName}</span>
                                <span style="font-weight:bold;">
                                    ${formattedValue}
                                </span>
                            </div>
                        `;
                    });
                    return res;
                }
            },
            toolbox: {
                show: isExportMode ? false : true,
                right: 20,
                feature: {
                    restore: { title: 'Reset' }
                }
            },
            dataZoom: isExportMode ? [] : [
                { type: 'inside', start: 0, end: 100 },
            ],
            legend: {
                data: legendData,
                icon: 'roundRect',
                top: 0,
                selectedMode: isExportMode ? false : 'multiple',
                cursor: isExportMode ? 'default' : 'pointer',
            },
            color: colorPalette,
            grid: {
                left: '1%',
                right: '2%',
                top: '40px',
                bottom: '1%',
                containLabel: true,
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: data.map((item) => item.timestamp),
                axisLabel: {
                    formatter: (value: any) => {
                        const formatted = timeFormatter(value);

                        const parts = formatted.split(' ');
                        if (parts.length >= 2) {
                            const time = parts[0].substring(0, 5); // "08:45"
                            const date = parts[1].substring(0, 5); // "08/05"
                            return `${time}\n${date}`;
                        }
                        return formatted;
                    },
                    color: '#888',
                    fontSize: 10,
                },
                axisLine: { lineStyle: { color: '#E8E8E8' } },
            },
            yAxis: {
                type: 'value',
                name: isDDoS ? 'bits' : 'Packets',
                nameTextStyle: {
                    color: '#888',
                    fontSize: baseFontSize * 0.85,
                    align: 'right',
                    padding: [0, 5, 0, 0]
                },
                splitLine: { lineStyle: { type: 'dashed', color: '#F0F0F0' } },
                axisLabel: {
                    color: '#888',
                    fontSize: baseFontSize * 0.85,
                    formatter: isDDoS
                        ? (value: number) => `${bitFormatter(value)}`
                        : (value: number) => value.toLocaleString(),
                },
                // axisLabel: { color: '#888', fontSize: 11 },
            },
            series: seriesData,
            animation: data.length < 1000,
        };
    }, [data, isExportMode, theme]);

    return (
        loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Spin size="large" />
            </div>
        ) : (
            <ReactECharts
                ref={chartRef}
                option={option}
                style={{ height: '100%', width: '100%', minHeight: '350px' }}
                notMerge={true}
                lazyUpdate={true}
            />)
    );
};

export default AnalyzeActionChart;