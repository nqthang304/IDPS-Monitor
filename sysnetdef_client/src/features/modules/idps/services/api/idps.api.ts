import axiosClient from "@/config/api/axiosClient";
import type { 
    IdpsStatusResponse, IdpsUpdatePayload, IdpsActiveRuleCount, 
    IdpsRule, IRulesWithPagination, AnalyzeTrafficResponse 
} from "@/features/types/idps.type";
import type { ApiResponse } from "@/features/types";
import { logger } from "@/utils/logger.utils";

type IdpsRuleQueryParams = {
    page?: number;
    limit?: number;
    ruleId?: number;
    description?: string;
    sourceIp?: string;
    destinationIp?: string;
    sourcePort?: string | number;
    destinationPort?: string | number;
    protocol?: string;
    action?: string;
    severity?: number;
    status?: boolean;
};

type IdpsRuleCreatePayload = {
    status: boolean;
    ruleId: number;
    description: string;
    sourceIp: string;
    destinationIp: string;
    sourcePort: string | number;
    destinationPort: string | number;
    protocol: string;
    action: string;
    severity: number;
};

export const idpsApi = {
    getAnalyzeData: async (startTime: string, endTime: string): Promise<ApiResponse<AnalyzeTrafficResponse>> => {
        try {
            logger.debug('IDPS', `Fetching analyze data from ${startTime} to ${endTime}`);
            const response = await axiosClient.get<ApiResponse<AnalyzeTrafficResponse>>("/idps/analyze", {
                params: { start: startTime, end: endTime }
            });

            logger.success('IDPS', 'Analyze data fetched successfully');
            return response.data; // 👈 Bóc lớp vỏ Axios ở đây
        } catch (error: any) {
            logger.error('IDPS', `Error fetching analyze data: ${error.message || 'Network Error'}`);
            throw error.response?.data || { message: "Không thể kết nối máy chủ để phân tích dữ liệu" };
        }
    },

    getIdpsStatus: async (): Promise<ApiResponse<IdpsStatusResponse>> => {
        try {
            logger.debug('IDPS', 'Fetching IDPS system status');
            const response = await axiosClient.get<ApiResponse<IdpsStatusResponse>>("/idps/system-status");
            logger.success('IDPS', response.data?.message || 'IDPS system status fetched successfully');
            return response.data;
        } catch (error: any) {
            logger.error('IDPS', `Error fetching IDPS Status: ${error.message || 'Unknown Error'}`);
            // Trả về mock data an toàn bọc trong ApiResponse
            return { 
                success: false, 
                status: 500, 
                message: "Lấy trạng thái thất bại", 
                data: { active: false, mode: 'ids' } 
            };
        }
    },

    updateIdpsStatus: async (payload: IdpsUpdatePayload): Promise<ApiResponse> => {
        try {
            logger.info('IDPS', `Updating system status to: Active=${payload.active}, Mode=${payload.mode}`);
            const response = await axiosClient.patch<ApiResponse>("/idps/system-status", payload);

            logger.success('IDPS', 'System status updated successfully');
            return response.data;
        } catch (error: any) {
            logger.error('IDPS', `Failed to update IDPS Status: ${error.message || 'Unknown Error'}`);
            throw error.response?.data || { message: "Lỗi hệ thống khi cập nhật trạng thái hệ thống IDPS" };
        }
    },

    getIdpsActiveRuleCount: async (): Promise<IdpsActiveRuleCount> => {
        try {
            const response = await idpsApi.getIdpsRules({
                page: 1,
                limit: 1,
                status: true,
            });

            if (response.data && response.data.pagination) {
                return {
                    count: response.data.pagination.total ?? 0
                };
            }

            return { count: 0 };
        } catch (error: any) {
            logger.error('IDPS', `Failed to get active rule count: ${error.message || 'Unknown Error'}`);
            return { count: 0 };
        }
    },

    getIdpsRules: async (params?: IdpsRuleQueryParams): Promise<ApiResponse<IRulesWithPagination>> => {
        try {
            const {
                page, limit, ruleId, description, sourceIp, destinationIp,
                sourcePort, destinationPort, protocol, action, severity, status,
            } = params || {};

            const queryParams: Record<string, any> = {
                page: page ?? 1,
                limit: limit ?? 20,
            };

            if (ruleId !== undefined) queryParams.ruleId = ruleId;
            if (description) queryParams.description = description;
            if (sourceIp) queryParams.sourceIp = sourceIp;
            if (destinationIp) queryParams.destinationIp = destinationIp;
            if (sourcePort !== undefined && sourcePort !== null && sourcePort !== "") queryParams.sourcePort = sourcePort;
            if (destinationPort !== undefined && destinationPort !== null && destinationPort !== "") queryParams.destinationPort = destinationPort;
            if (protocol) queryParams.protocol = protocol;
            if (action) queryParams.action = action;
            if (severity !== undefined) queryParams.severity = severity;
            if (status !== undefined) queryParams.status = status;

            logger.debug('IDPS', `Fetching rules list (Page: ${queryParams.page}, Limit: ${queryParams.limit})`);

            // Vì cấu trúc rules đặc biệt cần nhào nặn lại, ta vẫn để kiểu Generic nới lỏng ở Axios
            const response = await axiosClient.get<any>("/idps/", {
                params: queryParams,
            });
            console.debug('IDPS', `Raw response received for rules list:`, response);
            const backendData = response.data; // Đây là cục data do backend trả về

            // Check mảng rules từ backend trả về (thích ứng theo việc backend gói data thế nào)
            const rawRules = Array.isArray(backendData?.data) ? backendData.data : (Array.isArray(backendData) ? backendData : []);

            const mappedRules: IdpsRule[] = rawRules.map((item: any) => ({
                id: item.id,
                ruleId: item.ruleId,
                status: item.status,
                description: item.description,
                protocol: item.protocol,
                action: item.action,
                severity: item.severity,
                srcIP: item.sourceIp,
                dstIP: item.destinationIp,
                srcPort: item.sourcePort,
                dstPort: item.destinationPort,
            }));

            logger.debug('IDPS', `Successfully mapped ${mappedRules.length} rules from response`);
            
            // Ép cấu trúc trả về chuẩn ApiResponse<IRulesWithPagination>
            return {
                status: response.status, 
                success: backendData?.success ?? true,
                message: backendData?.message || "Success",
                data: {
                    rules: mappedRules,
                    pagination: backendData?.pagination
                },
            };
        } catch (error: any) {
            logger.error('IDPS', `Error fetching rules list: ${error.message || 'System Error'}`);
            throw error.response?.data || { message: "Lỗi hệ thống" };
        }
    },

    createIdpsRule: async (payload: IdpsRuleCreatePayload): Promise<ApiResponse<any>> => {
        try {
            logger.info('IDPS', `Creating new rule: [${payload.protocol}] ${payload.action}`);
            const response = await axiosClient.post<ApiResponse<any>>("/idps/", payload);
            console.debug('IDPS', `Raw response received for rule creation:`, response);
            logger.success('IDPS', `Rule created successfully`);
            return response.data;
        } catch (error: any) {
            logger.error('IDPS', `Failed to create rule: ${error.message || 'System Error'}`);
            throw error.response?.data || { message: "Lỗi hệ thống" };
        }
    },

    deleteIdpsRule: async (ruleId: number): Promise<ApiResponse> => {
        try {
            logger.info('IDPS', `Attempting to delete rule ID: ${ruleId}`);
            const response = await axiosClient.delete<ApiResponse>(`/idps/${ruleId}`);

            logger.success('IDPS', `Deleted rule ID: ${ruleId} successfully`);
            return response.data;
        } catch (error: any) {
            logger.error('IDPS', `Failed to delete rule ${ruleId}: ${error.message || 'System Error'}`);
            throw error.response?.data || { message: "Lỗi hệ thống khi xóa rule" };
        }
    },

    bulkDeleteIdpsRules: async (ids: number[]): Promise<ApiResponse> => {
        try {
            logger.info('IDPS', `Attempting bulk delete for ${ids.length} rules`);
            const response = await axiosClient.delete<ApiResponse>(`/idps/`, {
                data: { ids }
            });
            
            logger.success('IDPS', `Bulk delete completed successfully`);
            return response.data;
        } catch (error: any) {
            logger.error('IDPS', `Failed to execute bulk delete: ${error.message || 'System Error'}`);
            throw error.response?.data || { message: "Lỗi hệ thống khi xóa hàng loạt" };
        }
    },


    updateStatusRules: async (ids: number[], status: boolean): Promise<ApiResponse> => {
        try {
            logger.info('IDPS', `Bulk updating status to [${status}] for ${ids.length} rules`);
            const response = await axiosClient.patch<ApiResponse>("/idps/bulk-status", {
                ids,
                status
            });

            logger.success('IDPS', `Bulk status update successful`);
            return response.data;
        } catch (error: any) {
            logger.error('IDPS', `Failed to execute bulk status update: ${error.message || 'System Error'}`);
            throw error.response?.data || { message: "Lỗi hệ thống khi cập nhật trạng thái hàng loạt" };
        }
    },

    updateIdpsRule: async (ruleId: number, payload: Partial<IdpsRuleCreatePayload>): Promise<ApiResponse<any>> => {
        try {
            logger.info('IDPS', `Updating rule ID: ${ruleId}`);
            const response = await axiosClient.put<ApiResponse<any>>(`/idps/${ruleId}`, payload);

            logger.success('IDPS', `Updated rule ID: ${ruleId} successfully`);
            return response.data;
        } catch (error: any) {
            logger.error('IDPS', `Failed to update rule ${ruleId}: ${error.message || 'System Error'}`);
            throw error.response?.data || { message: "Lỗi hệ thống khi cập nhật rule" };
        }
    },
};