import React, { useMemo } from 'react';
import { Table, Switch, Space, Button, Tooltip, Tag, Input, InputNumber } from 'antd';
import { FormOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType, TableProps, ColumnType } from 'antd/es/table';
import styles from './rulesTable.module.css';
import type { IdpsRule } from '@/features/types/idps.type';

type RulesTableChangeHandler = NonNullable<TableProps<IdpsRule>['onChange']>;

interface RulesTableProps {
    dataSource: IdpsRule[];
    loading?: boolean;
    pagination?: any;
    onChange?: RulesTableChangeHandler;
    onEdit?: (record: IdpsRule) => void;
    onDelete?: (record: IdpsRule) => void;
    onStatusChange?: (checked: boolean, record: IdpsRule) => void;
    selectedRowKeys?: number[];
    onSelectChange?: (keys: number[]) => void;
    onLimitChange?: (limit: number) => void;
    
    // Quản lý trạng thái chọn tất cả các trang từ ô tích chính
    isAllPagesSelected: boolean;
    onSelectAllPagesChange: (selected: boolean) => void;
}

// --- CÁC CELL ĐƯỢC MEMO HÓA ---
const SeverityCell = React.memo(({ severity }: { severity: number }) => {
    const severityClass = severity === 1 ? styles.severity1 : severity === 2 ? styles.severity2 : severity === 3 ? styles.severity3 : styles.severity4;
    return <Tag className={severityClass}>{severity}</Tag>;
});

const ActionCell = React.memo(({ action }: { action: string }) => {
    const actionClass = action.toLowerCase() === 'alert' ? styles.alertAction : styles.dropAction;
    return <Tag className={actionClass}>{action?.toUpperCase()}</Tag>;
});

const ProtocolCell = React.memo(({ protocol }: { protocol: string }) => {
    const normalizedProtocol = protocol?.toUpperCase();
    const protocolClass = normalizedProtocol === 'UDP' ? styles.protocolUdp : normalizedProtocol === 'ICMP' ? styles.protocolIcmp : styles.protocolTcp;
    return <Tag className={protocolClass}>{normalizedProtocol}</Tag>;
});

const StatusCell = React.memo(({ status, record, onStatusChange }: { status: boolean; record: IdpsRule; onStatusChange?: (checked: boolean, record: IdpsRule) => void }) => (
    <Switch checked={status} size="small" onChange={(checked) => onStatusChange?.(checked, record)} />
));

const ActionsCell = React.memo(({ record, onEdit, onDelete }: { record: IdpsRule; onEdit?: (record: IdpsRule) => void; onDelete?: (record: IdpsRule) => void }) => (
    <Space size="small">
        <Tooltip title="Edit">
            <Button type="text" size="small" icon={<FormOutlined />} onClick={() => onEdit?.(record)} />
        </Tooltip>
        <Tooltip title={!record.status ? "Delete" : ""}>
            <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => onDelete?.(record)}
                style={{
                    opacity: record.status ? 0 : 1,
                    pointerEvents: record.status ? 'none' : 'auto'
                }}
            />
        </Tooltip>
    </Space>
));

// --- COMPONENT CHÍNH ---
const RulesTable: React.FC<RulesTableProps> = ({
    dataSource,
    loading,
    pagination,
    onChange,
    onEdit,
    onDelete,
    onStatusChange,
    selectedRowKeys = [],
    onSelectChange,
    onLimitChange,
    isAllPagesSelected,
    onSelectAllPagesChange,
}) => {

    const rowSelection = useMemo(() => ({
        // Nếu chọn tất cả các trang, ô checkbox Header sẽ sáng toàn bộ (bằng cách giả lập mảng id trang hiện tại)
        selectedRowKeys: isAllPagesSelected ? dataSource.map(item => item.id) : selectedRowKeys,
        
        // Khi chọn hoặc bỏ chọn từng dòng lẻ tẻ
        onChange: (keys: React.Key[]) => {
            if (isAllPagesSelected) {
                onSelectAllPagesChange(false); // Đang chọn tất cả mà bỏ tích lẻ một dòng thì tắt chế độ chọn tất cả các trang
            }
            onSelectChange?.(keys as number[]);
        },
        
        // Thay vì dùng selections dropdown, ta xử lý trực tiếp hành động click ô Checkbox Header
        onSelectAll: (selected: boolean) => {
            if (selected) {
                onSelectAllPagesChange(true); // Bật cờ chọn tất cả các trang
                onSelectChange?.(dataSource.map(item => item.id)); // Đắp tạm ID trang hiện tại hiển thị lên UI
            } else {
                onSelectAllPagesChange(false); // Tắt cờ chọn tất cả các trang
                onSelectChange?.([]); // Xóa trắng mảng được chọn
            }
        },
        columnWidth: '4%',
        fixed: true,
    }), [selectedRowKeys, isAllPagesSelected, dataSource, onSelectChange, onSelectAllPagesChange]);

    const getColumnSearchProps = (placeholder: string): ColumnType<IdpsRule> => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
            <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
                <Input
                    placeholder={`Search ${placeholder}`}
                    value={selectedKeys[0]}
                    onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => confirm()}
                    style={{ marginBottom: 8, display: 'block' }}
                />
                <Space>
                    <Button type="primary" onClick={() => confirm()} icon={<SearchOutlined />} size="small" style={{ width: 90 }}>
                        Search
                    </Button>
                    <Button
                        onClick={() => {
                            clearFilters && clearFilters();
                            confirm(); 
                        }}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Reset
                    </Button>
                </Space>
            </div>
        ),
        filterIcon: (filtered: boolean) => (
            <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />
        ),
    });

    const columns: ColumnsType<IdpsRule> = useMemo(() => [
        {
            title: 'Status', dataIndex: 'status', key: 'status', align: 'center', width: '7%',
            filters: [{ text: 'Enabled', value: true }, { text: 'Disabled', value: false }],
            render: (status: boolean, record) => <StatusCell status={status} record={record} onStatusChange={onStatusChange} />,
        },
        { title: 'SID', dataIndex: 'ruleId', key: 'ruleId', width: '7%', align: 'center', sorter: (a, b) => a.ruleId - b.ruleId, ...getColumnSearchProps('SID') },
        { title: 'Description', dataIndex: 'description', key: 'description', width: '12%', ...getColumnSearchProps('description') },
        {
            title: 'Source IP', dataIndex: 'srcIP', key: 'srcIP', align: 'center', width: '13%', ...getColumnSearchProps('source IP'),
            render: (text) => <Tag className={styles.srcIP}>{text || 'Any'}</Tag>,
        },
        {
            title: 'Destination IP', dataIndex: 'dstIP', key: 'dstIP', align: 'center', width: '13%', ...getColumnSearchProps('destination IP'),
            render: (text) => <Tag className={text ? styles.dstIP : ''}>{text || 'Any'}</Tag>,
        },
        {
            title: 'Source port', dataIndex: 'srcPort', key: 'srcPort', width: '13%', align: 'center', ...getColumnSearchProps('source port'),
            render: (text) => <Tag className={styles.srcPort}>{text || 'Any'}</Tag>,
        },
        {
            title: 'Destination port', dataIndex: 'dstPort', key: 'dstPort', width: '15%', align: 'center', ...getColumnSearchProps('destination port'),
            render: (text) => <Tag className={styles.dstPort}>{text || 'Any'}</Tag>,
        },
        {
            title: 'Action', dataIndex: 'action', key: 'action', align: 'center', width: '10%',
            filters: [{ text: 'Alert', value: 'alert' }, { text: 'Drop', value: 'drop' }],
            render: (action: string) => <ActionCell action={action} />,
        },
        { title: 'Protocol', dataIndex: 'protocol', key: 'protocol', align: 'center', width: '11%', ...getColumnSearchProps('protocol'), render: (protocol: string) => <ProtocolCell protocol={protocol} /> },
        { title: 'Severity', dataIndex: 'severity', key: 'severity', width: '8%', align: 'center', filters: [{ text: '1', value: 1 }, { text: '2', value: 2 }, { text: '3', value: 3 }, { text: '4', value: 4 }], render: (severity: number) => <SeverityCell severity={severity} /> },
        { title: 'Options', key: 'options', align: 'center', width: '7%', render: (_, record) => <ActionsCell record={record} onEdit={onEdit} onDelete={onDelete} /> },
    ], [onEdit, onDelete, onStatusChange]);

    return (
        <div className={styles.tableWrapper}>
            <Table
                rowSelection={rowSelection}
                columns={columns}
                dataSource={dataSource}
                loading={loading}
                rowKey="id"
                pagination={{
                    current: pagination?.current,
                    pageSize: pagination?.pageSize,
                    total: pagination?.total,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50', '100'],
                    placement: 'bottomRight' as any,
                    size: 'small',
                    showTotal: (total) => (
                        <Space style={{ marginRight: 24 }}>
                            <span>Total {total} items</span>
                            <span style={{ color: '#ccc' }}>|</span>
                            <span>Limit:</span>
                            <InputNumber
                                size="small"
                                min={1}
                                max={1000}
                                placeholder="Input limit"
                                style={{ width: '70px' }}
                                onPressEnter={(e: any) => {
                                    const val = parseInt(e.target.value, 10);
                                    if (!isNaN(val) && val > 0) {
                                        onLimitChange?.(val);
                                    }
                                }}
                            />
                        </Space>
                    )
                }}
                onChange={onChange}
                bordered
                size="small"
                tableLayout="fixed"
                rowClassName={() => styles.fixedHeightRow}
            />
        </div>
    );
};

export default React.memo(RulesTable);