import axiosClient from "@/config/api/axiosClient";
import type { logUsage, logsRetention, activitySettings } from '@/features/types/logs.type';
import type { ApiResponse } from "@/features/types";
import { logger } from "@/utils/logger.utils";

export const logApi = {
    getLogsUsage: async (): Promise<ApiResponse<logUsage>> => {
        logger.debug('LOGS_MANAGER', 'Fetching Logs Usage data...');
        const response = await axiosClient.get('device-storage/disk-usage');
        console.log('Received Logs Usage response:', response);
        logger.success('LOGS_MANAGER', 'Fetched Logs Usage successfully');
        return response.data;
    },

    getLogsRetention: async (): Promise<ApiResponse<logsRetention>> => {
        logger.debug('LOGS_MANAGER', 'Fetching mock Logs Retention data');
        return {
            success: true,
            status: 200,
            data: {
                usageLimit: 70,
                autoClean: true,
                fileRotation: true
            }
        }
    },

    getActivitySettings: async (): Promise<ApiResponse<activitySettings>> => {
        logger.debug('LOGS_MANAGER', 'Fetching mock Activity Settings data');
        return {
            success: true,
            status: 200,
            data: {
                cleanActive: true,
                cleanTime: 30,
            }
        }
    },

    updateLogsRetention: async (payload: logsRetention): Promise<ApiResponse<null>> => {
        // Thực tế: return await axiosClient.put('/logs/retention', payload);
        logger.info('LOGS_MANAGER', `Updating Logs Retention with: ${JSON.stringify(payload)}`);
        return { success: true, status: 200, data: null };
    },

    updateActivitySettings: async (payload: activitySettings): Promise<ApiResponse<null>> => {
        // Thực tế: return await axiosClient.put('/logs/activity-settings', payload);
        logger.info('LOGS_MANAGER', `Updating Activity Settings with: ${JSON.stringify(payload)}`);
        return { success: true, status: 200, data: null };
    },

    getIDPSLogFiles: async (type: 'normal' | 'drop' | 'alert'): Promise<ApiResponse<any[]>> => {
        try {
            logger.debug('LOGS_MANAGER', `Requesting IDPS log files list (Type: ${type})`);
            const response = await axiosClient.get(`idps/log-files`, {
                params: { type }
            });
            return response.data;
        } catch (error: any) {
            logger.error('LOGS_MANAGER', `Failed to fetch IDPS log files: ${error.message || 'System Error'}`);
            throw error.response?.data || { message: "System error while fetching log files list" };
        }
    },

    downloadLogFile: async (fileId: string, format: string): Promise<Blob> => {
        try {
            logger.info('LOGS_MANAGER', `Initiating download for log file ID: ${fileId} (Format: ${format})`);
            const response : any = await axiosClient.get(`idps/logs/download/${fileId}`, {
                params: { format },
                responseType: 'blob',
            });
            logger.success('LOGS_MANAGER', `Log file ${fileId} downloaded successfully`);
            return response;
        } catch (error: any) {
            logger.error('LOGS_MANAGER', `Failed to download log file ${fileId}: ${error.message || 'System Error'}`);
            throw error.response?.data || { message: "System error while downloading log file" };
        }
    },

    getAuditLogs: async (params?: { page?: number; limit?: number }): Promise<ApiResponse<any>> => {
        try {
            logger.debug('LOGS_MANAGER', 'Fetching Audit Logs data...');
            const response = await axiosClient.get('audit-logs', { params });
            return response.data;
        } catch (error: any) {
            logger.error('LOGS_MANAGER', `Failed to fetch Audit Logs: ${error.message || 'System Error'}`);
            throw error.response?.data || { message: "System error while fetching audit logs" };
        }
    },

    deleteAuditLogsByIds: async (ids: React.Key[]): Promise<ApiResponse<any>> => {
        try {
            logger.info('LOGS_MANAGER', `Deleting audit logs by IDs: ${JSON.stringify(ids)}`);
            const response = await axiosClient.post('audit-logs/delete-by-ids', { ids });
            return response.data;
        } catch (error: any) {
            logger.error('LOGS_MANAGER', `Failed to delete audit logs: ${error.message || 'System Error'}`);
            throw error.response?.data || { message: "System error while deleting audit logs" };
        }
    },

    deleteAuditLogsByTimeRange: async (from: string, to: string): Promise<ApiResponse<any>> => {
        try {
            logger.info('LOGS_MANAGER', `Deleting audit logs between ${from} and ${to}`);
            const response = await axiosClient.post('audit-logs/delete-by-range', { from, to });
            return response.data;
        } catch (error: any) {
            logger.error('LOGS_MANAGER', `Failed to delete audit logs by range: ${error.message || 'System Error'}`);
            throw error.response?.data || { message: "System error while deleting audit logs by time range" };
        }
    },
};