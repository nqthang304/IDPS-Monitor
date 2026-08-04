import React, { useEffect, useCallback, useMemo } from 'react';
import { Modal, Form, Input, Select, Row, Col, Switch, Button, Flex } from 'antd';
import styles from './ruleFormModal.module.css';
import type { IdpsRule } from '@/features/types/idps.type';

interface RuleFormModalProps {
    open: boolean;
    onClose: () => void;
    initialData?: IdpsRule | null; // Nếu có data là Edit, null là Add
    onSubmit: (values: any) => void;
    loading?: boolean;
}

const PROTOCOL_OPTIONS = [
    { value: 'TCP', label: 'TCP' },
    { value: 'UDP', label: 'UDP' },
    { value: 'ICMP', label: 'ICMP' }
];

const SEVERITY_OPTIONS = [1, 2, 3, 4];

const getProtocolClassName = (protocol: string) => {
    const normalizedProtocol = protocol?.toUpperCase();

    if (normalizedProtocol === 'UDP') {
        return styles.protocolUdp;
    }

    if (normalizedProtocol === 'ICMP') {
        return styles.protocolIcmp;
    }

    return styles.protocolTcp;
};

const RuleFormModal: React.FC<RuleFormModalProps> = ({ open, onClose, initialData, onSubmit, loading }) => {
    const [form] = Form.useForm();
    const isEdit = useMemo(() => !!initialData, [initialData]);

    const handleFormFinish = useCallback((values: any) => {
        onSubmit(values);
    }, [onSubmit]);

    // Cập nhật giá trị form khi dữ liệu initialData thay đổi
    useEffect(() => {
        if (open) {
            if (initialData) {
                form.setFieldsValue(initialData);
            } else {
                form.resetFields();
                form.setFieldsValue({ status: true }); // Mặc định enable khi tạo mới
            }
        }
    }, [open, initialData, form]);

    return (
        <Modal
            title={<span className={styles.modalTitle}>{isEdit ? 'Edit rule' : 'Add manual rule'}</span>}
            open={open}
            onCancel={onClose}
            footer={null}
            width={450}
            centered
            className={styles.customModal}
        >
            <Form form={form} layout="vertical" onFinish={handleFormFinish}>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item label="Description" name="description" rules={[{ required: true }]}>
                            <Input.TextArea
                                placeholder="Enter description..."
                                className={styles.customInput}
                                autoSize={{ minRows: 1, maxRows: 6 }}
                            />
                        </Form.Item>
                        <Form.Item label="Source IP" name="srcIP" rules={[{ required: true }]}>
                            <Input placeholder="Any" className={styles.customInput} />
                        </Form.Item>
                        <Form.Item label="Source port" name="srcPort" rules={[{ required: true }]}>
                            <Input placeholder="Any" className={styles.customInput} />
                        </Form.Item>
                        <Form.Item label="Destination IP" name="dstIP" rules={[{ required: true }]}>
                            <Input placeholder="Any" className={styles.customInput} />
                        </Form.Item>
                        <Form.Item label="Destination port" name="dstPort" rules={[{ required: true }]}>
                            <Input placeholder="Any" className={styles.customInput} />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        {isEdit ? (
                            <Form.Item label="SID" name="ruleId">
                                <Input className={styles.customInput} disabled={isEdit} />
                            </Form.Item>
                        ) : (null)}
                        <Form.Item label="Protocol" name="protocol" initialValue="TCP">
                            <Select className={styles.customSelect}>
                                {PROTOCOL_OPTIONS.map((option) => (
                                    <Select.Option key={option.value} value={option.value}>
                                        <span className={getProtocolClassName(option.value)}>{option.label}</span>
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item label="Action" name="action" initialValue="alert">
                            <Select
                                className={styles.customSelect}
                                classNames={{
                                    popup: {
                                        root: styles.actionDropdown
                                    }
                                }}
                            >
                                <Select.Option value="alert"><span className={styles.tagAlert}>Alert</span></Select.Option>
                                <Select.Option value="drop"><span className={styles.tagDrop}>Drop</span></Select.Option>
                            </Select>
                        </Form.Item>

                        <Form.Item label="Severity" name="severity" initialValue={1}>
                            <Select className={styles.customSelect}>
                                {SEVERITY_OPTIONS.map(v => (
                                    <Select.Option key={v} value={v}>
                                        <div className={styles.severityOption}>
                                            <span className={styles[`sev${v}`]}>{v}</span>
                                        </div>
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>
                <Flex justify="space-between" align="center" className={styles.footerAction}>
                    <Flex align="center" gap={8}>
                        <span>Enable rule</span>
                        <Form.Item name="status" valuePropName="checked" noStyle>
                            <Switch size="small" />
                        </Form.Item>
                    </Flex>

                    <Flex gap={10}>
                        <Button onClick={onClose} className={styles.btnCancel}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={loading} className={styles.btnCreate}>
                            {isEdit ? 'Update' : 'Create'}
                        </Button>
                    </Flex>
                </Flex>
            </Form>
        </Modal>
    );
};

export default React.memo(RuleFormModal);