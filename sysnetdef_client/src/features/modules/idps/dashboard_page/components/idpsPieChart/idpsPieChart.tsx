import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, theme as antdTheme } from 'antd';
import { useIdpsStore } from '@/features/modules/idps/dashboard_page/store/idpsStore';
import type { CustomThemeTokens } from '@/theme/themeConfig';
import { PieChartFilled } from '@ant-design/icons';

const IdpsPieChart: React.FC = () => {
    const { useToken } = antdTheme;
    const { token } = useToken();
    const theme = token as typeof token & CustomThemeTokens;

    const normal = useIdpsStore((state) => state.summary?.normal ?? 0);
    const alert = useIdpsStore((state) => state.summary?.alert ?? 0);
    const malwareAlert = useIdpsStore((state) => state.summary?.malwareAlert ?? 0);
    const drop = useIdpsStore((state) => state.summary?.drop ?? 0);
    const malwareDrop = useIdpsStore((state) => state.summary?.malwareDrop ?? 0);

    const malwareAlertPct = useIdpsStore((state) => state.percentages?.malwareAlertPct ?? 0);
    const malwareDropPct = useIdpsStore((state) => state.percentages?.malwareDropPct ?? 0);

    const option = useMemo(() => {
        return {
            tooltip: {
                trigger: 'item',
                formatter: (params: any) => {
                    const { name, value, color, percent } = params;

                    let tooltipHtml = `
                        <div style="font-family: ${theme.fontFamily}; min-width: 160px;">
                        <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px;">Action: ${name}</div>
                        <div style="display: flex; align-items: center; margin-bottom: 4px;">
                            <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background-color:${color}; margin-right:8px;"></span>
                            <span>Total: <strong>${value}</strong> (${percent}%)</span>
                        </div>
                    `;

                    if (name === 'Alert') {
                        tooltipHtml += `
                            <div style="margin-top: 10px; border-top: 1px dashed ${theme.colorBorder}; padding-top: 10px;">
                                <div style="color: ${theme.colorError}; font-weight: bold; margin-bottom: 4px;">Malware (Alert):</div>
                                <div>Alert: <strong>${malwareAlert}</strong> packets</div>
                                <div>Percentage: <strong>${malwareAlertPct}%</strong></div>
                            </div>
                        `;
                    } else if (name === 'Drop') {
                        tooltipHtml += `
                            <div style="margin-top: 10px; border-top: 1px dashed ${theme.colorBorder}; padding-top: 10px;">
                            <div style="color: ${theme.colorError}; font-weight: bold; margin-bottom: 4px;">Malware (Drop):</div>
                            <div>Drop: <strong>${malwareDrop}</strong> packets</div>
                            <div>Percentage: <strong>${malwareDropPct}%</strong></div>
                        </div>
                        `;
                    }

                    tooltipHtml += `</div>`;
                    return tooltipHtml;
                },
            },
            legend: {
                orient: 'horizontal',
                top: '5%',
                left: 'center',
                textStyle: {
                    fontSize: 14,
                    fontWeight: 500,
                    color: theme.colorText,
                },
            },
            color: [theme.idpsNormal, theme.idpsAlert, theme.idpsDrop],
            series: [
                {
                    name: 'Action Distribution',
                    type: 'pie',
                    radius: '70%',
                    center: ['50%', '55%'],
                    avoidLabelOverlap: false,
                    itemStyle: {
                        borderColor: theme.colorBgContainer,
                        borderWidth: 2,
                    },
                    label: { show: false },
                    emphasis: {
                        label: { show: false },
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.35)'
                        }
                    },
                    labelLine: { show: false },
                    data: [
                        { value: normal, name: 'Normal' },
                        { value: alert + malwareAlert, name: 'Alert' },
                        { value: drop + malwareDrop, name: 'Drop' },
                    ],
                },
            ],
        };
        // Dependency chỉ bao gồm các biến số thực sự thay đổi của Pie
    }, [normal, alert, malwareAlert, drop, malwareDrop, malwareAlertPct, malwareDropPct, theme]);

    return (
        <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PieChartFilled style={{ color: '#1890ff' }} />
                <span>Normal/Alert/Drop</span>
              </div>
            }
            variant="borderless" 
            style={{
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
            }}
            styles={{ body: { flex: 1, minHeight: 0, padding: '16px', display: 'flex', flexDirection: 'column' } }}
        >
            <div style={{ width: '100%', flex: 1, minHeight: '280px', position: 'relative' }}>
                <ReactECharts
                    option={option}
                    style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0 }}
                    lazyUpdate={true} 
                    opts={{ renderer: 'canvas' }}
                />
            </div>
        </Card>
    );
};

export default React.memo(IdpsPieChart);