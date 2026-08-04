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
    // 2. Gọi API verify
    const response = await authApi.verifyToken();

    if (response.success && response.data) {
      if (response.data.role) {
        localStorage.setItem('user_role', response.data.role);
      }
      return response.data;
    } else {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_role');
      return redirect('/login');
    }
  } catch (error) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    return redirect('/login');
  }
};

// Chặn người dùng không có quyền Admin vào các trang quản trị (Management/Logs/Users)
export const admin_protected_loader = async () => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    return redirect('/login');
  }

  try {
    const response = await authApi.verifyToken();
    if (response.success && response.data) {
      const role = response.data.role || localStorage.getItem('user_role');
      if (role) {
        localStorage.setItem('user_role', role);
      }

      if (role !== 'admin') {
        return redirect('/dashboard');
      }

      return response.data;
    } else {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_role');
      return redirect('/login');
    }
  } catch (error) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
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