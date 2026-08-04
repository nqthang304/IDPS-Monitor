import axiosClient from "@/config/api/axiosClient";
import type { ApiResponse } from "@/features/types";
import { logger } from "@/utils/logger.utils";

export interface UserItem {
  id: number;
  username: string;
  fullName?: string;
  UserFullName?: string;
  email?: string;
  Email?: string;
  role?: string;
  Role?: string;
  notify?: string;
  notificationEvents?: boolean;
  lastLogin?: string;
  createdDate?: string;
  createdAt?: string;
  [key: string]: any;
}

export const userApi = {
  getUsers: async (): Promise<ApiResponse<UserItem[]>> => {
    try {
      logger.debug("API", "Fetching users list...");
      const response = await axiosClient.get("users");
      return response.data;
    } catch (error: any) {
      logger.error("API", `Failed to fetch users: ${error.message || 'System Error'}`);
      throw error.response?.data || { message: "Lỗi hệ thống khi lấy danh sách user" };
    }
  },

  createUser: async (payload: Partial<UserItem>): Promise<ApiResponse<UserItem>> => {
    try {
      logger.info("API", `Creating user: ${payload.username}`);
      const response = await axiosClient.post("users", payload);
      return response.data;
    } catch (error: any) {
      logger.error("API", `Failed to create user: ${error.message || 'System Error'}`);
      throw error.response?.data || { message: "Lỗi hệ thống khi tạo user mới" };
    }
  },

  updateUser: async (id: number | string, payload: Partial<UserItem>): Promise<ApiResponse<UserItem>> => {
    try {
      logger.info("API", `Updating user ID: ${id}`);
      const response = await axiosClient.put(`users/${id}`, payload);
      return response.data;
    } catch (error: any) {
      logger.error("API", `Failed to update user ID ${id}: ${error.message || 'System Error'}`);
      throw error.response?.data || { message: "Lỗi hệ thống khi cập nhật thông tin user" };
    }
  },

  deleteUser: async (id: number | string): Promise<ApiResponse<any>> => {
    try {
      logger.info("API", `Deleting user ID: ${id}`);
      const response = await axiosClient.delete(`users/${id}`);
      return response.data;
    } catch (error: any) {
      logger.error("API", `Failed to delete user ID ${id}: ${error.message || 'System Error'}`);
      throw error.response?.data || { message: "Lỗi hệ thống khi xóa user" };
    }
  },
};
