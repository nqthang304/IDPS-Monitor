import React, { useMemo, useRef, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Skeleton } from 'antd';
import type { ColoredTopIPEntry } from '@/application/pages/idps/idpsAnalyze/idpsAnalyze';
import { timeFormatter,bitFormatter } from '@/utils/formatter.utils';

interface Props {
    data: ColoredTopIPEntry[];
    loading?: boolean;
}

const TopIPChart: React.FC<Props> = ({ data, loading }) => {
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
        if (!data || data.length === 0) return {};

        const xAxisData = data[0].history.map(h => h.timestamp);

        return {
            legend: {
                show: false,
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'line' },
                confine: true,
                formatter: (params: any[]) => {
                    if (!params || params.length === 0) return '';
                    const timestamp = params[0].name;

                    // SỬ DỤNG timeFormatter
                    const fullTimeStr = timeFormatter(timestamp);

                    let res = `<div style="font-weight:bold;margin-bottom:4px;">${fullTimeStr}</div>`;
                    params.forEach(item => {
                        res += `
                            <div style="display:flex; justify-content:space-between; gap:15px;">
                                <span>${item.marker} ${item.seriesName}</span>
                                <span style="font-weight:bold;">${bitFormatter(item.value)}</span>
                            </div>
                        `;
                    });
                    return res;
                }
            },
            toolbox: {
                feature: {
                    restore: { title: 'Reset' }
                }
            },
            grid: {
                left: '2%',
                right: '2%',
                top: '17%',
                bottom: '1%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: xAxisData,
                axisLabel: {
                    margin: 8,
                    formatter: (value: any) => {
                        // SỬ DỤNG timeFormatter cho trục X
                        const formatted = timeFormatter(value);
                        const parts = formatted.split(' ');
                        if (parts.length >= 2) {
                            // Hiển thị Giờ ở trên, Ngày ở dưới (bỏ giây cho gọn)
                            const time = parts[0].substring(0, 5);
                            const date = parts[1].substring(0, 5);
                            return `${time}\n${date}`;
                        }
                        return formatted;
                    },
                    color: '#888',
                    fontSize: 10,
                },
                axisTick: { show: false },
                axisLine: { lineStyle: { color: '#E8E8E8' } }
            },
            yAxis: {
                type: 'value',
                name: 'bits',
                nameTextStyle: {
                    color: '#888',
                    fontSize: 11,
                    align: 'right',
                    padding: [0, 5, 0, 0]
                },
                axisLabel: {
                    color: '#888',
                    fontSize: 11,
                    formatter: (value: number) => bitFormatter(value)
                },
                splitLine: { lineStyle: { type: 'dashed', color: '#F0F0F0' } }
            },
            dataZoom: [
                { type: 'inside', start: 0, end: 100 },
                {
                    type: 'slider',
                    show: false,
                    start: 0,
                    end: 100
                }
            ],
            series: data.map(ip => ({
                name: ip.ipAddress,
                type: 'line',
                smooth: true,
                showSymbol: false,
                data: ip.history.map(h => h.bits),
                // --- THÊM MÀU SẮC TỪ DATA ---
                itemStyle: {
                    color: ip.renderColor // Đồng bộ màu dấu chấm và legend
                },
                lineStyle: {
                    width: 1.8,
                    color: ip.renderColor // Đồng bộ màu đường kẻ
                },
                sampling: 'lttb'
            }))
        };
    }, [data]);

    if (loading) return <Skeleton.Button active style={{ width: '100%', height: '100%' }} />;

    return (
        <ReactECharts
            ref={chartRef}
            option={option}
            style={{ height: '100%', width: '100%' }}
            notMerge={true}
        />
    );
};

export default TopIPChart;