import React, { useState, useEffect } from 'react';
import { Modal, Upload, Button, Flex, Typography, Alert } from 'antd';
import { CloudUploadOutlined, FileTextOutlined, CloseOutlined } from '@ant-design/icons';
import styles from './importRuleFileModal.module.css';

const { Dragger } = Upload;
const { Text } = Typography;

interface ImportRuleFileModalProps {
    open: boolean;
    onClose: () => void;
    onImport: (values: File) => void;
    loading?: boolean;
}

const ImportRuleFileModal: React.FC<ImportRuleFileModalProps> = ({
    open,
    onClose,
    onImport,
    loading,
}) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null); // State quản lý lỗi trong modal

    // Reset lỗi khi đóng/mở modal
    useEffect(() => {
        if (!open) {
            setError(null);
            setSelectedFile(null);
        }
    }, [open]);

    const handleImport = () => {
        setError(null);

        if (!selectedFile) {
            setError('Please upload a rules file!');
            return;
        }

        onImport(selectedFile);
    };

    const uploadProps = {
        customRequest: ({ file, onSuccess }: any) => {
            setSelectedFile(file);
            setError(null); // Xóa lỗi nếu chọn file mới hợp lệ
            onSuccess("ok");
        },
        showUploadList: false,
        maxCount: 1,
        accept: ".rules, .txt",
        beforeUpload: (file: any) => {
            const isRulesFile = file.name.endsWith('.rules') || file.name.endsWith('.txt');
            if (!isRulesFile) {
                setError('Invalid file format. Only .rules and .txt files are accepted.');
                return Upload.LIST_IGNORE;
            }

            const isLt5GB = file.size / 1024 / 1024 < 10;
            if (!isLt5GB) {
                setError('File size exceeds the 10MB limit!');
                return Upload.LIST_IGNORE;
            }
            return true;
        },
    };

    return (
        <Modal
            title={<span className={styles.modalTitle}>Import rule file</span>}
            open={open}
            onCancel={onClose}
            footer={null}
            width={480}
            centered
            className={styles.customModal}
        >
            <div className={styles.container}>
                {/* VÙNG THÔNG BÁO LỖI (CHỈ HIỆN KHI CÓ LỖI) */}
                {error && (
                    <div className={styles.errorAlert}>
                        <Alert title={error} type="error" showIcon closable onClose={() => setError(null)} />
                    </div>
                )}

                {/* VÙNG 1: Ô DRAG & DROP */}
                <Dragger {...uploadProps} className={styles.customDragger}>
                    <p className="ant-upload-drag-icon">
                        <CloudUploadOutlined style={{ color: '#8c8c8c', fontSize: '48px' }} />
                    </p>
                    <p className={styles.draggerText}>Drag & drop .rules or .txt file here</p>
                    <p className={styles.draggerOr}>or</p>
                    <Button type="primary" className={styles.btnBrowse}>Browser file</Button>
                </Dragger>

                {/* VÙNG 2: DÒNG HIỂN THỊ FILE ĐÃ CHỌN */}
                {selectedFile && (
                    <div className={styles.fileDisplayRow}>
                        <Flex align="center" gap={12} style={{ flex: 1, minWidth: 0 }}>
                            <FileTextOutlined style={{ fontSize: '20px', color: '#1677ff' }} />
                            <Text strong ellipsis className={styles.fileName}>
                                Select file: {selectedFile.name}
                            </Text>
                        </Flex>
                        <Button
                            type="text"
                            danger
                            size="small"
                            icon={<CloseOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFile(null);
                                setError(null);
                            }}
                        />
                    </div>
                )}

                {/* FOOTER */}
                <Flex justify="flex-end" gap={12} className={styles.footer}>
                    <Button onClick={onClose} className={styles.btnCancel}>Cancel</Button>
                    <Button type="primary" onClick={handleImport} loading={loading} className={styles.btnImport}>
                        Import
                    </Button>
                </Flex>
            </div>
        </Modal>
    );
};

export default ImportRuleFileModal;