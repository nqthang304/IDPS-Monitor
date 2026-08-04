import React, { useMemo } from 'react';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import styles from './idpsLog.module.css';
import { useIdpsStore, type ExtendedIDPSPacket } from '@/features/modules/idps/dashboard_page/store/idpsStore';
import { useResponsiveFont } from '@/hooks/useResponsiveFont';

const IdpsLogs: React.FC = () => {
  const logs = useIdpsStore((state) => state.logs);
  const baseFontSize = useResponsiveFont();

  const columns: ColumnsType<ExtendedIDPSPacket> = useMemo(() => {
    const getFilters = (dataIndex: keyof ExtendedIDPSPacket) => {
      const uniqueValues = Array.from(new Set(logs.map((item) => item[dataIndex])));
      return uniqueValues
        .filter(val => val !== undefined && val !== null)
        .map((val) => ({ text: String(val), value: val as string | number }));
    };

    return [
      { 
        title: 'Timestamp', 
        dataIndex: 'timestamp', 
        key: 'timestamp', 
        width: 180, // Dùng px cố định cho cột fixed
        align: 'center', 
        fixed: 'left' // Cố định bên trái
      },
      { title: 'Source IP', dataIndex: 'srcIP', key: 'srcIP', width: 150, align: 'center', filters: getFilters('srcIP'), onFilter: (value, record) => record.srcIP === value },
      { title: 'Destination IP', dataIndex: 'dstIP', key: 'dstIP', width: 150, align: 'center', filters: getFilters('dstIP'), onFilter: (value, record) => record.dstIP === value },
      { title: 'Source port', dataIndex: 'srcPort', key: 'srcPort', width: 110, align: 'center', filters: getFilters('srcPort'), onFilter: (value, record) => record.srcPort === value },
      { title: 'Destination port', dataIndex: 'dstPort', key: 'dstPort', width: 140, align: 'center', filters: getFilters('dstPort'), onFilter: (value, record) => record.dstPort === value },
      {
        title: 'Action',
        dataIndex: 'action',
        key: 'action',
        width: 100,
        align: 'center',
        filters: [
          { text: 'Normal', value: 'Normal' },
          { text: 'Alert', value: 'Alert' },
          { text: 'Drop', value: 'Drop' },
          { text: 'Malware', value: 'Malware' },
        ],
        onFilter: (value, record) => {
          if (value === 'Malware') return record.isMalware === 1;
          return record.action === value && record.isMalware === 0;
        },
        render: (_, record) => (record.isMalware === 1 ? 'Malware' : record.action),
      },
      { 
        title: 'Rule type', 
        dataIndex: 'ruleType', 
        key: 'ruleType', 
        filters: getFilters('ruleType'), 
        ellipsis: true, 
        width: 300 
      },
      { 
        title: 'Severity', 
        dataIndex: 'severity', 
        key: 'severity', 
        width: 100, 
        align: 'center', 
        filters: getFilters('severity'), 
        onFilter: (value, record) => record.severity === value,
        fixed: 'right' // Cố định bên phải
      },
      { 
        title: 'Protocol', 
        dataIndex: 'protocol', 
        key: 'protocol', 
        width: 100, 
        align: 'center', 
        filters: getFilters('protocol'), 
        onFilter: (value, record) => record.protocol === value,
        fixed: 'right' // Cố định bên phải
      },
    ];
  }, [logs]);

  const getRowClassName = (record: ExtendedIDPSPacket) => {
    if (record.isMalware === 1) return styles.rowMalware;
    switch (record.action) {
      case 'Alert': return styles.rowAlert;
      case 'Drop': return styles.rowDrop;
      default: return styles.rowNormal;
    }
  };

  return (
    <div className={styles.container}>
      <Table
        columns={columns}
        dataSource={logs}
        rowKey="_id"
        rowClassName={getRowClassName}
        pagination={false}
        virtual
        scroll={{ y: 500, x: 1400 }} 
        sticky={true}
        size="small"
        tableLayout="fixed"
        style={{ fontSize: `${baseFontSize}px` }}
      />
    </div>
  );
};

export default React.memo(IdpsLogs);