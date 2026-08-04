import { db } from "../../core/database/drizzle";
import { auditLogs } from "../schema/auditLogs.model";
import { desc, inArray, and, gte, lte, lt } from "drizzle-orm";

export interface CreateAuditLogDto {
  userId: number;
  username: string;
  action: string;
  status: string;
  result?: string;
}

export function getGMT7TimeString(): string {
  const now = new Date();
  const gmt7 = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return gmt7.toISOString().replace('T', ' ').substring(0, 19);
}

export function normalizeDbTime(input: string): string {
  if (!input) return "";
  const trimmed = input.trim();
  if (trimmed.endsWith("Z") || (trimmed.includes("T") && trimmed.includes("+"))) {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const gmt7 = new Date(d.getTime() + 7 * 60 * 60 * 1000);
      return gmt7.toISOString().replace("T", " ").substring(0, 19);
    }
  }
  return trimmed.replace("T", " ").substring(0, 19);
}

export class AuditLogRepository {
  async create(data: CreateAuditLogDto) {
    try {
      return await db.insert(auditLogs).values({
        userId: data.userId,
        username: data.username,
        time: getGMT7TimeString(),
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

  async deleteByIds(ids: number[]) {
    if (!ids || ids.length === 0) return 0;
    return await db.delete(auditLogs).where(inArray(auditLogs.id, ids)).run();
  }

  async deleteByTimeRange(fromTime: string, toTime: string) {
    const normalizedFrom = normalizeDbTime(fromTime);
    const normalizedTo = normalizeDbTime(toTime);
    return await db.delete(auditLogs).where(and(gte(auditLogs.time, normalizedFrom), lte(auditLogs.time, normalizedTo))).run();
  }

  async deleteOlderThanDays(days: number) {
    if (days <= 0) return 0;
    const now = new Date();
    const gmt7Now = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const cutoffDate = new Date(gmt7Now.getTime() - days * 24 * 60 * 60 * 1000);
    const cutoffTimeStr = cutoffDate.toISOString().replace('T', ' ').substring(0, 19);

    const result = await db.delete(auditLogs).where(lt(auditLogs.time, cutoffTimeStr)).run();
    return result.changes ?? 0;
  }
}
