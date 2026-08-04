import React from 'react';
import { Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { bitFormatter, cntFormatter } from '@/utils/formatter.utils';
import type { ColoredTopIPEntry } from '@/application/pages/idps/idpsAnalyze/idpsAnalyze';
import styles from './topIPTable.module.css';

const { Text } = Typography;

interface Props {
    data: ColoredTopIPEntry[];
    loading?: boolean;
}

const TopIPTable: React.FC<Props> = ({ data, loading }) => {
    const columns: ColumnsType<ColoredTopIPEntry> = [
        {
            title: 'IP address',
            dataIndex: 'ipAddress',
            key: 'ipAddress',
            render: (text) => (
                <Text strong>
                    {text}
                </Text>
            ),
        },
        {
            title: 'Bits',
            dataIndex: 'bits',
            key: 'bits',
            width: '25%',
            align: 'right',
            render: (value) => <Text>{bitFormatter(value)}</Text>,
            sorter: (a, b) => a.bits - b.bits,
        },
        {
            title: 'Packets',
            dataIndex: 'packets',
            key: 'packets',
            width: '25%',
            align: 'right',
            render: (value) => <Text>{cntFormatter(value)}</Text>,
            sorter: (a, b) => a.packets - b.packets,
        },
    ];

    return (
        <Table
            className={styles.customTable}
            columns={columns}
            dataSource={data}
            rowKey="ipAddress"
            pagination={false}
            size="small"
            loading={loading}
            scroll={{ y: '100%' }}
            // --- ĐỔ MÀU CHO CẢ DÒNG ---
            onRow={(record) => {
                return {
                    style: {
                        // Thêm màu nền nhạt (opacity ~ 10%) dựa trên màu của line
                        backgroundColor: `${record.renderColor}CC`,
                        cursor: 'default'
                    },
                };
            }}
        />
    );
};

export default TopIPTable;