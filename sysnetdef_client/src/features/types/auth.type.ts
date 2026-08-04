export interface UserData {
  id: string;
  username: string;
  role: string;
  // Các quyền (permissions) an ninh mạng sẽ thêm ở đây
}

export interface LoginResponse {
  token: string;
  user: UserData;
}

export interface LoginPayload {
  username: string;
  password: string;
}