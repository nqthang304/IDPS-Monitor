import axiosClient from "@/config/api/axiosClient";
import type { ApiResponse } from "@/features/types/index";
import type { LoginResponse, LoginPayload } from "@/features/types/auth.type";

export const authApi = {
  login: async (payload: LoginPayload): Promise<ApiResponse<LoginResponse>> => {
    // Chỉ cần gọi endpoint phụ, axiosClient đã có sẵn URL gốc /api
    const res = await axiosClient.post("/auth/login", payload);
    return res.data;
  },

  verifyToken: async (): Promise<ApiResponse<any>> => {
    // Không cần truyền token vào tham số nữa, interceptor đã lo
    const res = await axiosClient.get("/auth/verify");
    return res.data;
  },
};