import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserRepository } from "../../../../database/repository/user.repository";
import { ENV } from "../../../../core/config/env";
import { AuditLogger } from "../../../../shared/utils/auditLogger.utils";

export class AuthService {
  private userRepository = new UserRepository();

  async login(username: string, password: string) {
    const user = await this.userRepository.findByUsername(username);

    if (!user) {
      await AuditLogger.logLogin(0, username, 'FAILED', 'Tài khoản không tồn tại');
      throw new Error("Tài khoản hoặc mật khẩu không chính xác");
    }

    // 1. Kiểm tra mật khẩu đã mã hóa
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await AuditLogger.logLogin(user.id, username, 'FAILED', 'Mật khẩu không chính xác');
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

    // 4. Ghi audit log thành công
    await AuditLogger.logLogin(user.id, username, 'SUCCESS', 'Đăng nhập thành công');

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }
}