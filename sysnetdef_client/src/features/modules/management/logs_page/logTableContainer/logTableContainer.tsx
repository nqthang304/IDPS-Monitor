import React, { useState, useMemo } from 'react';
import { Tabs, Table, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TableRowSelection } from 'antd/es/table/interface';
import styles from './logTableContainer.module.css';
import { FormOutlined } from '@ant-design/icons';
import ExportModal from '../exportModal/exportModal';

interface SubTabConfig {
  key: string;
  label: string;
  data?: any[];
}

interface LogTableContainerProps {
  tabs: SubTabConfig[];
  // Cập nhật type: thêm callback onSuccess vào hàm onExport
  onExport?: (selectedRows: any[], format: string, onSuccess: () => void) => void;
}

const LogTableContainer: React.FC<LogTableContainerProps> = ({ tabs, onExport }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(tabs[0]?.key);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const isTabHidden = tabs.length === 0 || (tabs.length === 1 && (!tabs[0].key || tabs[0].key.trim() === ''));

  // Hàm dùng để reset trạng thái chọn
  const clearSelection = () => {
    setSelectedRowKeys([]);
    setSelectedRows([]);
  };

  const columns: ColumnsType<any> = useMemo(() => [
    { title: 'Name Logs', dataIndex: 'name', key: 'name', width: '25%' },
    { title: 'Capture from', dataIndex: 'from', key: 'from', width: '25%' },
    { title: 'To', dataIndex: 'to', key: 'to', width: '25%' },
    { title: 'Size', dataIndex: 'size', key: 'size', width: '25%' },
  ], []);

  const rowSelection: TableRowSelection<any> = {
    selectedRowKeys,
    columnWidth: 50,
    onChange: (newSelectedRowKeys: React.Key[], newSelectedRows: any[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
      setSelectedRows(newSelectedRows);
    },
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    clearSelection(); // Reset khi đổi tab
    setCurrentPage(1); 
  };

  const renderTable = (data?: any[], customStyle?: React.CSSProperties) => (
    <div className={styles.tableWrapper} style={customStyle}>
      <Table
        rowSelection={{ type: 'checkbox', ...rowSelection }}
        rowKey={(record) => record.id || record.fileId}
        dataSource={data || []}
        columns={columns}
        bordered
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          position: ['bottomRight'],
          showTotal: (total) => `Total ${total} items`,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          },
        }}
        size="small"
      />
    </div>
  );

  const items = useMemo(() => 
    tabs.map((tab) => ({
      key: tab.key,
      label: tab.label,
      children: renderTable(tab.data),
    })), 
  [tabs, columns, selectedRowKeys, pageSize, currentPage]); 

  const handleOpenModal = () => {
    if (selectedRows.length === 0) return;
    setIsModalVisible(true);
  };

  const handleConfirmExport = (format: string) => {
    setIsModalVisible(false);
    // Truyền thêm hàm clearSelection để cha gọi sau khi export thành công
    onExport?.(selectedRows, format, clearSelection);
  };

  return (
    <div className={styles.container}>
      <div className={styles.actionBar}>
        <Button
          type="primary"
          className={`${selectedRowKeys.length > 0 ? styles.exportBtn : styles.disabledExport}`}
          onClick={handleOpenModal}
        >
          <span style={{ marginRight: 8 }}><FormOutlined /></span>
          Export
        </Button>
      </div>

      {isTabHidden ? (
        renderTable(tabs[0]?.data, { marginTop: '10px' })
      ) : (
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={items}
          type="card"
          className={styles.customTabs}
          style={{ padding: 0 }}
        />
      )}

      <ExportModal
        visible={isModalVisible}
        selectedFiles={selectedRows}
        onCancel={() => setIsModalVisible(false)}
        onConfirm={handleConfirmExport}
      />
    </div>
  );
};

export default LogTableContainer;