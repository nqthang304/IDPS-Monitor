// src/config/api/axiosClient.ts
import axios from "axios";
import { ENV } from "../env";
import type { InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { useLockStore } from "@/system/stores/useLockStore";
import { logger } from "../../utils/logger.utils"; // 👈 Import logger

const axiosClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// 1. Tự động gắn Token và xử lý Content-Type cho FormData
axiosClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("access_token");
  const isLocked = useLockStore.getState().isLocked;

  // Đảm bảo method luôn tồn tại và chuyển về chữ thường để check
  const isWriteRequest = ["post", "put", "patch", "delete"].includes(config.method?.toLowerCase() || "");

  if (isLocked && isWriteRequest) {
    const runningAction = useLockStore.getState().currentAction;

    // 👈 LOG: Cảnh báo chặn request do hệ thống đang khóa
    logger.warn('API', `Request Cancelled (System Locked): [${config.method?.toUpperCase()}] ${config.url}`);

    // Hủy request ngay lập tức bằng tính năng Cancel của Axios
    throw new axios.Cancel(JSON.stringify({
      message: "Hệ thống đang khóa để cấu hình. Vui lòng thử lại sau.",
      currentAction: runningAction // Truyền kèm currentAction vào lỗi Cancel
    }));
  }

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // KIỂM TRA: Nếu dữ liệu là FormData (dùng để upload file)
  // Xóa Content-Type để trình duyệt tự thiết lập multipart/form-data kèm boundary
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  // 👈 LOG: Ghi nhận request đang được gửi đi
  logger.debug('API', `Sending Request: [${config.method?.toUpperCase()}] ${config.url}`);

  return config;
});

// 2. Chuẩn hóa dữ liệu trả về và Bắn thông báo (Event Emitter)
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => {
    const rawData = response.data;
    const status = response.status;
    const method = response.config.method?.toLowerCase();
    const isWriteRequest = ["post", "put", "patch", "delete"].includes(method || "");

    if (status === 202 || (isWriteRequest && status === 200 && (rawData?.currentAction || rawData?.data?.currentAction))) {
      useLockStore.getState().setLocked(true, rawData?.currentAction);
      sessionStorage.setItem('is_initiator', 'true');
      
      // 👈 LOG: Ghi nhận hệ thống bị khóa do response từ server
      logger.info('API', `System state changed to LOCKED by response: ${response.config.url}`);
    }

    // BẮN SỰ KIỆN API THÀNH CÔNG (Chỉ bắn với các thao tác update/create/delete)
    if (isWriteRequest) {
      window.dispatchEvent(
        new CustomEvent("API_NOTIFY", {
          detail: {
            type: (status === 202 || (rawData?.currentAction || rawData?.data?.currentAction)) ? "info" : "success",
            message: rawData?.message || "Operation successful",
            status: status,
            currentAction: rawData?.currentAction || rawData?.data?.currentAction || null,
          },
        })
      );
    }

    // 👈 LOG: Request thành công
    logger.success('API', `Response Success [${status}]: ${response.config.url}`);
    return response;
  },

  (error): any => {
    // Trường hợp request bị chặn ngay từ Interceptor do isLocked (ném axios.Cancel)
    if (axios.isCancel(error)) {
      window.dispatchEvent(
        new CustomEvent("API_NOTIFY", {
          detail: {
            type: "warning",
            message: "System busy. Please wait for the current operation to complete.",
            status: "CANCELLED",
            currentAction: JSON.parse(error.message).currentAction // Lấy currentAction từ lỗi Cancel
          },
        })
      );
      return Promise.reject({ success: false, message: "System busy", status: "CANCELLED" });
    }

    // const status = error.response?.status;
    const rawError = error.response?.data;
    const requestUrl = error.config?.url || 'Unknown URL'; // Lấy URL gây lỗi để log
    const errorResponse = {
      success: false,
      message: rawError?.message || error.message || "Network Error",
      currentAction: rawError?.currentAction || null,
      status: error.response?.status,
    };

    // const status = error.response?.status;
    if (errorResponse.status === 503) {
      // 👈 LOG: Ghi nhận lỗi 503 Service Unavailable
      logger.warn('API', `Service Unavailable (503) at: ${requestUrl}`);
      useLockStore.getState().setLocked(true, rawError?.currentAction);
    }


    if (errorResponse.status === 401) {
      // 👈 LOG: Ghi nhận lỗi 401 Unauthorized
      logger.warn('API', `Unauthorized (401) at: ${requestUrl} - Token may be expired`);
      localStorage.removeItem("access_token");
    }

    // 👈 LOG: Ghi nhận lỗi API chung
    logger.error('API', `Response Error [${errorResponse.status || 'NETWORK'}]: ${requestUrl} - ${errorResponse.message}`);

    // BẮN SỰ KIỆN API LỖI RA CHO NotificationHandler BẮT LẤY
    window.dispatchEvent(
      new CustomEvent("API_NOTIFY", {
        detail: {
          type: errorResponse.status === 503 ? "warning" : "error",
          message: errorResponse.message,
          status: errorResponse.status,
          currentAction: errorResponse.currentAction,
        },
      })
    );

    return Promise.reject(error);
  }
);

export default axiosClient;