import { db } from "../../core/database/drizzle";
import { auditLogs } from "../schema/auditLogs.model";
import { desc } from "drizzle-orm";

export interface CreateAuditLogDto {
  userId: number;
  username: string;
  action: string;
  status: string;
  result?: string;
}

export class AuditLogRepository {
  async create(data: CreateAuditLogDto) {
    try {
      return await db.insert(auditLogs).values({
        userId: data.userId,
        username: data.username,
        action: data.action,
        status: data.status,
        result: data.result || null,
      }).returning().get();
    } catch (error: any) {
      console.error("Failed to create audit log in DB:", error?.message);
      return null;
    }
  }

  async getAll(limit = 100, offset = 0) {
    return await db.select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.time))
      .limit(limit)
      .offset(offset)
      .all();
  }

  async count() {
    const all = await db.select().from(auditLogs).all();
    return all.length;
  }
}
