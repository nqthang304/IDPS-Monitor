import { db } from "../../core/database/drizzle";
import { users } from "../schema/user.model";
import { eq } from "drizzle-orm";

export class UserRepository {
  async findByUsername(username: string) {
    return db.select().from(users).where(eq(users.username, username)).get();
  }

  async findByEmail(email: string) {
    return db.select().from(users).where(eq(users.email, email)).get();
  }

  async findById(id: number) {
    return db.select().from(users).where(eq(users.id, id)).get();
  }

  async updateLastLogin(id: number) {
    return db.update(users)
      .set({ lastLogin: new Date().toISOString() })
      .where(eq(users.id, id))
      .run();
  }

  async getAllUsers() {
    return db.select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      username: users.username,
      role: users.role,
      notify: users.notify,
      lastLogin: users.lastLogin,
      createTime: users.createTime,
    }).from(users).all();
  }

  async getNotifyActiveUsers() {
    return db.select().from(users).all();
  }

  async createUser(data: any) {
    return db.insert(users).values(data).returning().get();
  }

  async updateUser(id: number, data: any) {
    return db.update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning()
      .get();
  }

  async deleteUser(id: number) {
    return db.delete(users)
      .where(eq(users.id, id))
      .run();
  }
}