import React, { useState } from 'react';
import { Modal, Radio, Space, Typography, Divider } from 'antd';

const { Text } = Typography;

interface ExportModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (format: string) => void;
  selectedFiles: any[];
}

const ExportModal: React.FC<ExportModalProps> = ({ visible, onCancel, onConfirm, selectedFiles }) => {
  const [format, setFormat] = useState('.xlsx');

  return (
    <Modal
      title={<strong>Export Logs</strong>}
      open={visible}
      onCancel={onCancel}
      onOk={() => onConfirm(format)}
      okText="Export"
      cancelText="Cancel"
      okButtonProps={{ type: 'primary' }}
      cancelButtonProps={{ danger: true }}
    >
      <div style={{ marginBottom: 16 }}>
        {selectedFiles.map((file, index) => (
          <div key={index}><Text>filename {file.name}</Text></div>
        ))}
      </div>

      <Divider />

      <Radio.Group onChange={(e) => setFormat(e.target.value)} value={format}>
        <Space orientation="horizontal" wrap>
          <Radio value=".xlsx" defaultChecked><strong>.xlsx</strong></Radio>
          <Radio value=".txt"><strong>.txt</strong></Radio>
          <Radio value=".zip-xlsx"><strong>.zip-xlsx</strong></Radio>
          <Radio value=".zip-txt"><strong>.zip-txt</strong></Radio>
        </Space>
      </Radio.Group>
    </Modal>
  );
};

export default ExportModal;