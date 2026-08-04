import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserRepository } from "../../../../database/repository/user.repository";
import { ENV } from "../../../../core/config/env";

export class AuthService {
  private userRepository = new UserRepository();

  async login(username: string, password: string) {
    const user = await this.userRepository.findByUsername(username);

    if (!user) {
      throw new Error("Tài khoản hoặc mật khẩu không chính xác");
    }

    // 1. Kiểm tra mật khẩu đã mã hóa
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Tài khoản hoặc mật khẩu không chính xác");
    }

    // 2. Tạo JSON Web Token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      ENV.JWT_SECRET || "default_secret",
      { expiresIn: '24h' }
    );

    // 3. Cập nhật last login
    await this.userRepository.updateLastLogin(user.id);

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }
}