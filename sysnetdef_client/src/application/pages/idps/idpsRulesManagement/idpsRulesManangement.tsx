import { useState, useCallback, useEffect } from 'react'; 
import { Button, Space, Flex, Modal } from 'antd';
import { PlusOutlined, FileTextOutlined } from '@ant-design/icons';
import styles from './idpsRulesManagement.module.css';

import { useLoaderData } from 'react-router-dom';
import type { FilterValue, SorterResult, TablePaginationConfig } from 'antd/es/table/interface';

import PageTitle from '@/application/layout/pageTitle/pageTitle';
import RulesTable from '@/features/modules/idps/rulesManagement_page/rulesTable/rulesTable';
import RuleFormModal from '@/features/modules/idps/rulesManagement_page/ruleFormModal/ruleFormModal';
import ImportRuleFileModal from '@/features/modules/idps/rulesManagement_page/importRuleFileModal/importRuleFileModal';

import { idpsApi } from '@/features/modules/idps/services/api/idps.api';
import type { IdpsRule } from '@/features/types/idps.type';

const IdpsRulesManagement: React.FC = () => {
    const { confirm, warning } = Modal;
    const initialData = useLoaderData() as any;
    const [dataSource, setDataSource] = useState<IdpsRule[]>(initialData?.rules || []);

    const [loading, setLoading] = useState<boolean>(false);
    const [pagination, setPagination] = useState({
        current: initialData.pagination.currentPage || 1,
        pageSize: initialData.pagination.limit || 20,
        total: initialData.pagination.total || 0,
    });

    const [isRuleModalOpen, setIsRuleModalOpen] = useState<boolean>(false);
    const [selectedRule, setSelectedRule] = useState<IdpsRule | null>(null);

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
    
    const [isAllPagesSelected, setIsAllPagesSelected] = useState<boolean>(false);
    const [currentFilters, setCurrentFilters] = useState<Record<string, FilterValue | null>>({});

    const handleSelectChange = useCallback((keys: number[]) => {
        setSelectedRowKeys(keys);
    }, []);

    // Hàm bổ trợ thu thập tất cả các ID từ API (Chỉ gọi khi thực hiện các nút hành động hàng loạt)
    const resolveAllTargetIds = async (): Promise<number[]> => {
        if (!isAllPagesSelected) return selectedRowKeys;
        
        setLoading(true);
        try {
            const getSingleValue = <T,>(value: T | T[] | null | undefined) => Array.isArray(value) ? value[0] : value;
            const response = await idpsApi.getIdpsRules({
                page: 1,
                limit: pagination.total || 99999,
                description: getSingleValue(currentFilters?.description) as string | undefined,
                sourceIp: getSingleValue(currentFilters?.srcIP) as string | undefined,
                destinationIp: getSingleValue(currentFilters?.dstIP) as string | undefined,
                sourcePort: getSingleValue(currentFilters?.srcPort) as string | number | undefined,
                destinationPort: getSingleValue(currentFilters?.dstPort) as string | number | undefined,
                action: getSingleValue(currentFilters?.action) as string | undefined,
                protocol: getSingleValue(currentFilters?.protocol) as string | undefined,
                severity: getSingleValue(currentFilters?.severity) ? Number(getSingleValue(currentFilters?.severity)) : undefined,
                status: getSingleValue(currentFilters?.status) === true ? true : getSingleValue(currentFilters?.status) === false ? false : undefined,
            });
            
            return response.data?.rules?.map((r: IdpsRule) => r.id) || [];
        } catch (error) {
            return [];
        } finally {
            setLoading(false);
        }
    };

    const fetchRules = useCallback(async (page: number, limit: number, filters?: Record<string, FilterValue | null>) => {
        setLoading(true);
        console.log('Fetching rules with filters:', filters);
        try {
            const getSingleValue = <T,>(value: T | T[] | null | undefined) => Array.isArray(value) ? value[0] : value;
            const response = await idpsApi.getIdpsRules({
                page,
                limit,
                ruleId: getSingleValue(filters?.ruleId) as number | undefined,
                description: getSingleValue(filters?.description) as string | undefined,
                sourceIp: getSingleValue(filters?.srcIP) as string | undefined,
                destinationIp: getSingleValue(filters?.dstIP) as string | undefined,
                sourcePort: getSingleValue(filters?.srcPort) as string | number | undefined,
                destinationPort: getSingleValue(filters?.dstPort) as string | number | undefined,
                action: getSingleValue(filters?.action) as string | undefined,
                protocol: getSingleValue(filters?.protocol) as string | undefined,
                severity: getSingleValue(filters?.severity) ? Number(getSingleValue(filters?.severity)) : undefined,
                status: getSingleValue(filters?.status) === true ? true : getSingleValue(filters?.status) === false ? false : undefined,
            });
            console.log('Fetched rules response:', response);
            if (response.data) {
                setDataSource(response.data.rules);
                setPagination({
                    current: response.data.pagination.currentPage,
                    pageSize: response.data.pagination.limit,
                    total: response.data.pagination.total
                });
            }
        } catch (error) {
            // Handled globally
        } finally {
            setLoading(false);
        }
    }, []);

    const handleTableChange = (newPagination: TablePaginationConfig, filters: Record<string, FilterValue | null>, _sorter: SorterResult<IdpsRule> | SorterResult<IdpsRule>[]) => {
        setCurrentFilters(filters);
        setIsAllPagesSelected(false); // Đổi trang hoặc lọc mới sẽ hủy trạng thái chọn tất cả các trang
        setSelectedRowKeys([]);
        fetchRules(newPagination.current || 1, newPagination.pageSize || 20, filters);
    };

    useEffect(() => {
        const handleSystemNotify = (event: any) => {
            const { actionID, status } = event.detail;
            if (actionID === 'IDPS_RULES_UPDATE' && status === 200) {
                fetchRules(pagination.current, pagination.pageSize, currentFilters);
                setSelectedRowKeys([]); 
                setIsAllPagesSelected(false);
            }
        };
        window.addEventListener('SYS_NOTIFY_RECEIVED', handleSystemNotify);
        return () => window.removeEventListener('SYS_NOTIFY_RECEIVED', handleSystemNotify);
    }, [fetchRules, pagination.current, pagination.pageSize, currentFilters]);

    const handleStatusChange = useCallback(async (checked: boolean, record: IdpsRule) => {
        setDataSource(prev => prev.map(item => item.id === record.id ? { ...item, status: checked } : item));
        try {
            await idpsApi.updateStatusRules([record.id], checked);
        } catch (error) {
            setDataSource(prev => prev.map(item => item.id === record.id ? { ...item, status: !checked } : item));
        }
    }, []);

    const handleEnableAll = useCallback(async () => {
        const targetIds = await resolveAllTargetIds();
        if (!targetIds.length) return;
        try {
            await idpsApi.updateStatusRules(targetIds, true);
            setIsAllPagesSelected(false);
            setSelectedRowKeys([]);
            fetchRules(pagination.current, pagination.pageSize, currentFilters); 
        } catch (error) {}
    }, [selectedRowKeys, isAllPagesSelected, pagination.current, pagination.pageSize, currentFilters, fetchRules]);

    const handleDisableAll = useCallback(async () => {
        const targetIds = await resolveAllTargetIds();
        if (!targetIds.length) return;
        try {
            await idpsApi.updateStatusRules(targetIds, false);
            setIsAllPagesSelected(false);
            setSelectedRowKeys([]);
            fetchRules(pagination.current, pagination.pageSize, currentFilters);
        } catch (error) {}
    }, [selectedRowKeys, isAllPagesSelected, pagination.current, pagination.pageSize, currentFilters, fetchRules]);

    const handleDelete = useCallback((record: IdpsRule) => {
        confirm({
            title: 'Confirm deletion',
            content: (
                <div>
                    <p>Are you sure you want to delete rule SID <b>{record.ruleId}</b>?</p>
                    <p style={{ color: 'gray', fontSize: '12px', marginTop: 4 }}>This action cannot be undone.</p>
                </div>
            ),
            okText: 'Yes',
            okType: 'danger',
            cancelText: 'No',
            onOk: async () => {
                try {
                    await idpsApi.deleteIdpsRule(record.id);
                    setSelectedRowKeys(prev => prev.filter(key => key !== record.id));
                    fetchRules(pagination.current, pagination.pageSize, currentFilters);
                } catch (error) {}
            }
        });
    }, [fetchRules, pagination.current, pagination.pageSize, currentFilters, confirm]);

    const handleBulkDelete = useCallback(async () => {
        const targetIds = await resolveAllTargetIds();
        if (!targetIds.length) return;

        const enabledRulesInCurrentPage = dataSource.filter(
            (rule) => targetIds.includes(rule.id) && rule.status === true
        );

        if (enabledRulesInCurrentPage.length > 0) {
            warning({
                title: 'Cannot delete rules',
                content: (
                    <div>
                        <p>There are enabled rules in your selection on this page.</p>
                        <p>Please disable them before deleting.</p>
                    </div>
                ),
                okText: 'Close',
            });
            return;
        }

        confirm({
            title: 'Confirm bulk deletion',
            content: (
                <div>
                    <p>Are you sure you want to delete <b>{targetIds.length}</b> selected rules?</p>
                    <p style={{ color: '#ff4d4f', marginTop: 4 }}>This action will permanently remove them from the system.</p>
                </div>
            ),
            okText: 'Yes, delete all',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    await idpsApi.bulkDeleteIdpsRules(targetIds);
                    setSelectedRowKeys([]);
                    setIsAllPagesSelected(false);
                    fetchRules(pagination.current, pagination.pageSize, currentFilters);
                } catch (error) {}
            }
        });
    }, [selectedRowKeys, isAllPagesSelected, dataSource, fetchRules, pagination.current, pagination.pageSize, currentFilters, warning, confirm]);

    const handleAddClick = useCallback(() => {
        setSelectedRule(null); 
        setIsRuleModalOpen(true);
    }, []);

    const handleEdit = useCallback((record: IdpsRule) => {
        setSelectedRule(record);
        setIsRuleModalOpen(true);
    }, []);

    const handleFormSubmit = async (values: any) => {
        try {
            if (selectedRule) {
                await idpsApi.updateIdpsRule(selectedRule.ruleId, {
                    status: values.status,
                    ruleId: values.ruleId,
                    description: values.description,
                    sourceIp: values.srcIP,
                    destinationIp: values.dstIP,
                    sourcePort: values.srcPort,
                    destinationPort: values.dstPort,
                    protocol: values.protocol,
                    action: values.action,
                    severity: values.severity,
                });
            } else {
                await idpsApi.createIdpsRule({
                    status: values.status,
                    ruleId: values.ruleId,
                    description: values.description,
                    sourceIp: values.srcIP,
                    destinationIp: values.dstIP,
                    sourcePort: values.srcPort,
                    destinationPort: values.dstPort,
                    protocol: values.protocol,
                    action: values.action,
                    severity: values.severity,
                });
            }
            setIsRuleModalOpen(false);
            fetchRules(pagination.current, pagination.pageSize, currentFilters);
        } catch (error) {}
    };

    const handleImportSubmit = async (file: File) => {
        try {
            await idpsApi.importIdpsRules(file);
            setIsImportModalOpen(false);
        } catch (error) {}
    };

    const handleCustomLimit = (newLimit: number) => {
        fetchRules(1, newLimit, currentFilters);
    };

    // Đếm số lượng hiển thị trên thanh thông tin
    const displayedSelectionCount = isAllPagesSelected ? pagination.total : selectedRowKeys.length;

    return (
        <div className={styles.container}>
            <Flex justify='space-between' align='center' className={styles.header}>
                <PageTitle title="IDPS rules management" description="Manage your IDPS rules" />
                <div className={styles.actionArea}>
                    <div className={styles.actionBtn}>
                        <Space size="middle">
                            <Button type="primary" icon={<FileTextOutlined />} onClick={() => setIsImportModalOpen(true)} className={styles.btnImport}>
                                Import rules file
                            </Button>
                            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddClick} className={styles.btnAddManual}>
                                Add manual rule
                            </Button>
                        </Space>
                    </div>
                </div>
            </Flex>

            {/* Selection Info */}
            {displayedSelectionCount > 0 && (
                <Flex justify='space-between' align='center' className={styles.selectionInfo}>
                    <span>Selected <b>{displayedSelectionCount}</b> rules {isAllPagesSelected}</span>
                    <Space size="small">
                        <Button size="small" className={styles.enableAllButton} onClick={handleEnableAll}>Enable all</Button>
                        <Button size="small" className={styles.disableAllButton} onClick={handleDisableAll}>Disable all</Button>
                        <Button size="small" className={styles.deleteAllButton} onClick={handleBulkDelete}>Delete all</Button>
                    </Space>
                </Flex>
            )}

            <div className={styles.contentArea}>
                <RulesTable
                    dataSource={dataSource}
                    loading={loading}
                    pagination={pagination}
                    onChange={handleTableChange}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                    selectedRowKeys={selectedRowKeys}
                    onSelectChange={handleSelectChange}
                    onLimitChange={handleCustomLimit}
                    isAllPagesSelected={isAllPagesSelected}
                    onSelectAllPagesChange={setIsAllPagesSelected}
                />
            </div>
            <RuleFormModal open={isRuleModalOpen} onClose={() => setIsRuleModalOpen(false)} initialData={selectedRule} onSubmit={handleFormSubmit} />
            <ImportRuleFileModal open={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImport={handleImportSubmit} />
        </div>
    );
};

export default IdpsRulesManagement;