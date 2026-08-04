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
      await AuditLogger.logLogin(0, username, 'FAILED', 'Account does not exist');
      throw new Error("Invalid username or password");
    }

    // 1. Check hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await AuditLogger.logLogin(user.id, username, 'FAILED', 'Incorrect password');
      throw new Error("Invalid username or password");
    }

    // 2. Generate JSON Web Token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      ENV.JWT_SECRET || "default_secret",
      { expiresIn: '24h' }
    );

    // 3. Update last login
    await this.userRepository.updateLastLogin(user.id);

    // 4. Record audit log success
    await AuditLogger.logLogin(user.id, username, 'SUCCESS', 'Login successful');

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }
}