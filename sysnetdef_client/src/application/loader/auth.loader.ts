import {redirect} from 'react-router-dom';
// import {verifyToken_api} from '@/features/modules/auth/services/api/auth.api';
import { authApi } from "@/features/modules/auth/services/api/auth.api";

// Chặn vào dashboard
// export const protected_loader = async () => {
//     const token = localStorage.getItem('access_token');

//     if (!token) {
//         return redirect('/login');
//     }

//     const response = await verifyToken_api(token);
//     if (!response.success) {
//         localStorage.removeItem('access_token');
//         return redirect('/login');
//     }

//     return response.data;
// }
export const protected_loader = async () => {
  const token = localStorage.getItem('access_token');

  // 1. Kiểm tra nhanh ở Client: Nếu không có token thì "đuổi" về login luôn
  if (!token) {
    return redirect('/login');
  }

  try {
    // 2. Gọi API verify: Không cần truyền token vào tham số
    // axiosClient sẽ tự động lấy token từ localStorage và gắn vào Header
    const response = await authApi.verifyToken();

    if (response.success) {
      // Trả về dữ liệu user hoặc true để route tiếp tục render
      return response.data;
    } else {
      // Nếu backend báo token không hợp lệ/hết hạn
      localStorage.removeItem('access_token');
      return redirect('/login');
    }
  } catch (error) {
    // 3. Xử lý lỗi kết nối hoặc lỗi server (500, 404, v.v.)
    localStorage.removeItem('access_token');
    return redirect('/login');
  }
};

// Chặn user quay lại trang login sau khi đã đăng nhập thành công
export const public_loader = async () => {
    const token = localStorage.getItem('access_token');

    if (token) {
        const response = await authApi.verifyToken();
        if (response.success) {
            return redirect('/dashboard');
        } 
    }
    return null;
}