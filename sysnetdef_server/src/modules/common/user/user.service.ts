import bcrypt from "bcrypt";
import { UserRepository } from "../../../database/repository/user.repository";

export class UserService {
  private userRepository = new UserRepository();

  async getProfile(userId: number) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("User không tồn tại");
    }
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getUserById(id: number) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error("User không tồn tại");
    }
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getAllUsers() {
    return await this.userRepository.getAllUsers();
  }

  async createUser(data: {
    fullName?: string;
    email: string;
    username: string;
    password: string;
    role?: string;
    notify?: string;
    notificationEvents?: boolean;
  }) {
    const existingUsername = await this.userRepository.findByUsername(data.username);
    if (existingUsername) {
      throw new Error("Tên đăng nhập đã tồn tại");
    }

    const existingEmail = await this.userRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new Error("Email đã được sử dụng");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const notifyVal = data.notify || (data.notificationEvents === false ? 'disabled' : 'enabled');

    const newUser = await this.userRepository.createUser({
      fullName: data.fullName,
      email: data.email,
      username: data.username,
      password: hashedPassword,
      role: data.role || 'user',
      notify: notifyVal,
    });

    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  async updateUser(
    id: number,
    data: {
      fullName?: string;
      email?: string;
      password?: string;
      role?: string;
      notify?: string;
      notificationEvents?: boolean;
    }
  ) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error("User không tồn tại");
    }

    const updateData: any = {};
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.email !== undefined) {
      if (data.email !== user.email) {
        const existingEmail = await this.userRepository.findByEmail(data.email);
        if (existingEmail) {
          throw new Error("Email đã được sử dụng");
        }
      }
      updateData.email = data.email;
    }
    if (data.password && data.password.trim() !== '') {
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    if (data.role !== undefined) updateData.role = data.role;
    if (data.notify !== undefined) {
      updateData.notify = data.notify;
    } else if (data.notificationEvents !== undefined) {
      updateData.notify = data.notificationEvents ? 'enabled' : 'disabled';
    }

    const updatedUser = await this.userRepository.updateUser(id, updateData);
    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async deleteUser(id: number) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error("User không tồn tại");
    }
    await this.userRepository.deleteUser(id);
    return true;
  }
}
