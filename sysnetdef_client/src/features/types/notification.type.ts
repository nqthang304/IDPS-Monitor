export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface ApiResponsePayload {
  action_id: string;    // Định danh hành động (ví dụ: 'IPSEC_CREATE')
  status_code: number;  // Mã trạng thái (ví dụ: 200, 400, 500)
  message: string;      // Nội dung thông báo
}

export interface NotificationContextType {
  showNotification: (payload: ApiResponsePayload) => void;
}