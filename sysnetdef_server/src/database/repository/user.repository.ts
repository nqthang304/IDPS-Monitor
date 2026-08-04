import { db } from "../../core/database/drizzle";
import { users } from "../schema/user.model";
import { eq } from "drizzle-orm";

export class UserRepository {
  async findByUsername(username: string) {
    // Lấy user đầu tiên khớp username
    return db.select().from(users).where(eq(users.username, username)).get();
  }

  async updateLastLogin(id: number) {
    return db.update(users)
      .set({ lastLogin: new Date().toISOString() })
      .where(eq(users.id, id))
      .run();
  }

  async getAllUsers() {
    return db.select().from(users).all();
  }

  async getNotifyActiveUsers() {
    return db.select().from(users).all(); 
    // Sau đó filter ở Service hoặc dùng .where() của Drizzle nếu bạn đã định nghĩa các cột notify trong schema
  }
}