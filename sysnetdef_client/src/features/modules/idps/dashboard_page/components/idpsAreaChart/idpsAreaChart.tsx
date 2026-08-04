import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactEcharts from "echarts-for-react";
import { Card, theme as antdTheme } from "antd";
import { useIdpsStore } from "@/features/modules/idps/dashboard_page/store/idpsStore";
import { timeFormatter } from "@/utils/formatter.utils";
import { useResponsiveFont } from "@/hooks/useResponsiveFont";
import type { CustomThemeTokens } from "@/theme/themeConfig";
import { LineChartOutlined } from '@ant-design/icons';

const DEFAULT_VISIBLE_POINTS = 30;

const IdpsAreaChart: React.FC = () => {
  // --- 1. Lấy Theme Tokens giống ProtocolChart ---
  const { useToken } = antdTheme;
  const { token } = useToken();
  const theme = token as typeof token & CustomThemeTokens;
  const baseFontSize = useResponsiveFont();

  const chartRef = useRef<ReactEcharts>(null);
  const previousDataLengthRef = useRef(0);
  const [zoomWindow, setZoomWindow] = useState({ startValue: 0, endValue: DEFAULT_VISIBLE_POINTS - 1 });

  const onsecHistory = useIdpsStore((state) => state.onsecHistory);

  const adjustedTime = useMemo(() => {
    return onsecHistory.map((item) => Number(item.time));
  }, [onsecHistory]);

  const handleRestore = () => {
    const dataLength = adjustedTime.length;
    if (dataLength === 0) return;

    const latestIndex = dataLength - 1;
    // Thiết lập lại window về 30 điểm cuối cùng (hoặc DEFAULT_VISIBLE_POINTS)
    const nextStart = Math.max(0, latestIndex - DEFAULT_VISIBLE_POINTS + 1);

    setZoomWindow({
      startValue: nextStart,
      endValue: latestIndex,
    });
  };
  // Logic Zoom Window (Giữ nguyên như ProtocolChart)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (chartRef.current) {
        chartRef.current.getEchartsInstance().resize();
      }
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const dataLength = adjustedTime.length;
    const latestIndex = dataLength - 1;

    if (latestIndex < 0) {
      previousDataLengthRef.current = 0;
      return;
    }

    setZoomWindow((prev) => {
      const previousLatestIndex = previousDataLengthRef.current - 1;
      const previousWindowSize = prev.endValue - prev.startValue + 1;
      const windowSize = Math.max(1, previousWindowSize);

      const previousOffsetFromLatest = previousLatestIndex >= 0 ? Math.max(0, previousLatestIndex - prev.endValue) : 0;
      const nextEnd = Math.max(0, latestIndex - previousOffsetFromLatest);
      const nextStart = Math.max(0, nextEnd - windowSize + 1);

      return {
        startValue: nextStart,
        endValue: nextEnd,
      };
    });

    previousDataLengthRef.current = dataLength;
  }, [adjustedTime]);

  useEffect(() => {
    const chartInstance = chartRef.current?.getEchartsInstance();
    if (!chartInstance) return;

    const handleZoom = (params: any) => {
      const payload = params.batch?.[0] ?? params;
      const latestIndex = adjustedTime.length - 1;
      if (latestIndex < 0) return;

      let startValue: number | undefined = payload.startValue;
      let endValue: number | undefined = payload.endValue;

      if (startValue === undefined && typeof payload.start === 'number') {
        startValue = Math.round((payload.start / 100) * latestIndex);
      }
      if (endValue === undefined && typeof payload.end === 'number') {
        endValue = Math.round((payload.end / 100) * latestIndex);
      }
      if (startValue === undefined || endValue === undefined) return;

      let normalizedStart = Math.max(0, Math.min(startValue, latestIndex));
      let normalizedEnd = Math.max(0, Math.min(endValue, latestIndex));
      if (normalizedStart > normalizedEnd) {
        const temp = normalizedStart;
        normalizedStart = normalizedEnd;
        normalizedEnd = temp;
      }

      const pointsInView = Math.max(1, normalizedEnd - normalizedStart + 1);
      const offsetFromLatest = Math.max(0, latestIndex - normalizedEnd);
      const nextEnd = Math.max(0, latestIndex - offsetFromLatest);
      const nextStart = Math.max(0, nextEnd - pointsInView + 1);

      setZoomWindow({ startValue: nextStart, endValue: nextEnd });
    };

    chartInstance.off('dataZoom');
    chartInstance.on('dataZoom', handleZoom);

    chartInstance.off('restore');
    chartInstance.on('restore', handleRestore);

    return () => {
      chartInstance.off('dataZoom', handleZoom);
      chartInstance.off('restore', handleRestore);
    };
  }, [adjustedTime]);

  const option = useMemo(() => {
    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "cross", animation: false },
        formatter: function (params: any[]) {
          let result = `${timeFormatter(Number(params[0].name))}<br/>`;
          params.forEach((param) => {
            result += `
              <div style="display:flex; justify-content:space-between; min-width:200px; gap:10px;">
                <span style="display:flex; align-items:center;">
                  <span style="width:10px; height:10px; border-radius:50%; background-color:${param.color}; margin-right:5px;"></span>
                  ${param.seriesName}:
                </span>
                <span style="font-weight: 600;">${param.value} pkts</span>
              </div>`;
          });
          return result;
        },
      },
      toolbox: {
        show: true,
        right: 20,
        feature: {
          restore: { title: 'Reset view' }
        }
      },
      // --- 2. Áp dụng bảng màu từ Theme ---
      color: [
        theme.idpsNormal,       // Normal
        theme.idpsAlert,     // Alert (Cam)
        theme.idpsDrop,     // Drop (Đỏ)
        theme.idpsMalwareAlert,// Malware Alert
        theme.idpsMalwareDrop  // Malware Drop
      ],
      legend: {
        data: ["Normal", "Alert", "Drop", "Malware (Alert)", "Malware (Drop)"],
        type: "scroll",
        top: 5,
        left: "center",
        width: "85%",
        itemGap: 15,
        animationDurationUpdate: 300,
        pageButtonGap: 5,
        pageButtonPosition: "end",
        pageFormatter: "{current}/{total}",
        pageAnimation: true,
        textStyle: {
          fontSize: baseFontSize * 0.85,
          color: theme.colorTextDescription,
          lineHeight: baseFontSize * 1.2,
          padding: [2, 0, 0, 0],
        },
      },
      grid: {
        left: "20px",
        right: "35px",
        top: "50px",
        bottom: "15px",
        containLabel: true
      },
      xAxis: {
        type: "category",
        data: adjustedTime,
        boundaryGap: false,
        axisLabel: {
          hideOverlap: true,
          formatter: (value: any) => timeFormatter(Number(value)).replace(" ", "\n"),
          fontSize: baseFontSize * 0.8,
          color: '#888',
        },
      },
      yAxis: {
        type: "value",
        scale: true,
        boundaryGap: [0, "10%"],
        axisLabel: {
          fontSize: baseFontSize * 0.85,
          color: '#888'
        },
      },
      dataZoom: [
        {
          type: "inside",
          startValue: Math.min(zoomWindow.startValue, Math.max(0, adjustedTime.length - 1)),
          endValue: Math.min(zoomWindow.endValue, Math.max(0, adjustedTime.length - 1)),
          filterMode: "filter",
        },
      ],
      series: [
        {
          name: "Normal",
          type: "line",
          symbol: "none",
          sampling: "lttb",
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 1.5, color: theme.idpsNormal },
          emphasis: { focus: "series" },
          data: onsecHistory.map(item => item.normal),
        },
        {
          name: "Alert",
          type: "line",
          symbol: "none",
          sampling: "lttb",
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 1.5, color: theme.idpsAlert },
          emphasis: { focus: "series" },
          data: onsecHistory.map(item => item.alert),
        },
        {
          name: "Drop",
          type: "line",
          symbol: "none",
          sampling: "lttb",
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 1.5, color: theme.idpsDrop },
          emphasis: { focus: "series" },
          data: onsecHistory.map(item => item.drop),
        },
        {
          name: "Malware (Alert)",
          type: "line",
          symbol: "none",
          sampling: "lttb",
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 1, color: theme.idpsMalwareAlert, type: "dashed" },
          emphasis: { focus: "series" },
          data: onsecHistory.map(item => item.malwareAlert),
        },
        {
          name: "Malware (Drop)",
          type: "line",
          symbol: "none",
          sampling: "lttb",
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 1, color: theme.idpsMalwareDrop, type: "dashed" },
          emphasis: { focus: "series" },
          data: onsecHistory.map(item => item.malwareDrop),
        },
      ],
    };
  }, [adjustedTime, onsecHistory, zoomWindow, baseFontSize, theme]);

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LineChartOutlined style={{ color: '#1890ff' }} />
          <span>Sysnetdef traffic</span>
        </div>
      }
      style={{
        height: "100%",
        minHeight: "60vh",
        borderRadius: theme.borderRadius,
        display: "flex",
        flexDirection: "column"
      }}
      styles={{
        body: {
          flex: 1,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          minHeight: 0
        }
      }}
    >
      <ReactEcharts
        ref={chartRef}
        option={option}
        style={{ width: "100%", flex: 1 }}
        opts={{ renderer: "svg" }}
        notMerge={false}
        lazyUpdate={true}
      />
    </Card>
  );
};

export default React.memo(IdpsAreaChart);