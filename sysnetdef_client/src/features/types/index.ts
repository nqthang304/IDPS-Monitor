export interface ApiResponse<T = any> {
  success: boolean;
  status: number;
  data?: T;
  message?: string;
  errorCode?: number;
}
