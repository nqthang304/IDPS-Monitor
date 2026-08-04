import { db } from "../../core/database/drizzle";
import { idpsRules } from "../schema/idpsRules.model";
import { eq, and, like, inArray, sql, desc } from "drizzle-orm";
import { logger } from "@/shared/utils/logger.utils";

export class IdpsRuleRepository {
  private getCurrentTime() {
    return new Date().toISOString();
  }

  /**
   * Lấy danh sách rules có phân trang + FILTER ĐỘNG
   */
  async getRulesWithPagination(
    page: number = 1,
    limit: number = 100,
    filters: Partial<{
      ruleId: number;
      description: string;
      sourceIp: string;
      destinationIp: string;
      sourcePort: string;
      destinationPort: string;
      protocol: string;
      action: string;
      severity: number;
      status: boolean;
      createdAt: string;
    }> = {}
  ) {
    try {
      logger.info("IDPS_REPO", `getRulesWithPagination - Page: ${page}, Limit: ${limit}, Filters: ${JSON.stringify(filters)}`);

      const safeLimit = Math.max(1, limit);
      const offset = (page - 1) * safeLimit;

      const whereConditions: any[] = [];

      if (filters.ruleId !== undefined) {
        whereConditions.push(eq(idpsRules.ruleId, filters.ruleId));
      }
      if (filters.description?.trim()) {
        whereConditions.push(like(idpsRules.description, `%${filters.description.trim()}%`));
      }
      if (filters.sourceIp?.trim()) {
        whereConditions.push(like(idpsRules.sourceIp, `%${filters.sourceIp.trim()}%`));
      }
      if (filters.destinationIp?.trim()) {
        whereConditions.push(like(idpsRules.destinationIp, `%${filters.destinationIp.trim()}%`));
      }
      if (filters.sourcePort?.trim()) {
        whereConditions.push(like(idpsRules.sourcePort, `%${filters.sourcePort.trim()}%`));
      }
      if (filters.destinationPort?.trim()) {
        whereConditions.push(like(idpsRules.destinationPort, `%${filters.destinationPort.trim()}%`));
      }
      if (filters.protocol?.trim()) {
        whereConditions.push(eq(idpsRules.protocol, filters.protocol.trim()));
      }
      if (filters.action?.trim()) {
        whereConditions.push(eq(idpsRules.action, filters.action.trim()));
      }
      if (filters.severity !== undefined) {
        whereConditions.push(eq(idpsRules.severity, filters.severity));
      }
      if (filters.status !== undefined) {
        whereConditions.push(eq(idpsRules.status, filters.status));
      }

      const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

      const [data, totalCountResult] = await Promise.all([
        db
          .select()
          .from(idpsRules)
          .where(whereClause)
          .orderBy(desc(idpsRules.ruleId))
          .limit(safeLimit)
          .offset(offset)
          .all(),

        db
          .select({ count: sql<number>`count(*)` })
          .from(idpsRules)
          .where(whereClause)
          .get()
      ]);

      const total = totalCountResult?.count ?? 0;
      const totalPages = Math.ceil(total / safeLimit);

      return {
        data,
        pagination: {
          total,
          totalPages,
          currentPage: page,
          limit: safeLimit,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        }
      };
    } catch (error: any) {
      logger.error("IDPS_REPO", `Failed to getRulesWithPagination: ${error.message}`);
      throw error;
    }
  }

  async getExistingRuleIds(ruleIds: number[]): Promise<number[]> {
    try {
      logger.info("IDPS_REPO", `getExistingRuleIds - IDs: ${JSON.stringify(ruleIds)}`);
      if (!ruleIds || ruleIds.length === 0) return [];

      const result = await db
        .select({ ruleId: idpsRules.ruleId })
        .from(idpsRules)
        .where(inArray(idpsRules.ruleId, ruleIds))
        .all();

      return result.map(r => r.ruleId);
    } catch (error: any) {
      logger.error("IDPS_REPO", `Failed to getExistingRuleIds: ${error.message}`);
      throw error;
    }
  }

  async findByRuleId(ruleId: number) {
    try {
      logger.info("IDPS_REPO", `findByRuleId - ruleId: ${ruleId}`);
      return await db
        .select()
        .from(idpsRules)
        .where(eq(idpsRules.ruleId, ruleId))
        .get();
    } catch (error: any) {
      logger.error("IDPS_REPO", `Failed to findByRuleId ${ruleId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * ĐÃ FIX: Loại bỏ hoàn toàn transaction để tránh lỗi "cannot return a promise" trên SQLite
   */
  async createRule(data: Omit<typeof idpsRules.$inferInsert, 'ruleId'> & { ruleId?: number }) {
    try {
      logger.info("IDPS_REPO", `createRule - Data: ${JSON.stringify(data)}`);

      if (!data.ruleId) {
        data.ruleId = await this.getNextRuleId();
      }

      // Thực hiện insert trực tiếp
      const result = await db
        .insert(idpsRules)
        .values(data as typeof idpsRules.$inferInsert)
        .returning({ id: idpsRules.id, ruleId: idpsRules.ruleId })
        .get();

      return result;
    } catch (error: any) {
      logger.error("IDPS_REPO", `Failed to createRule: ${error.message}`);
      throw error;
    }
  }

  async getNextRuleId(): Promise<number> {
    try {
      const result = await db
        .select({ maxId: sql<number>`MAX(${idpsRules.ruleId})` })
        .from(idpsRules)
        .get();

      const maxId = result?.maxId ?? 999;
      return maxId + 1;
    } catch (error: any) {
      logger.error("IDPS_REPO", `Failed to calculate next ruleId: ${error.message}`);
      throw error;
    }
  }

  async bulkCreateRules(dataList: (typeof idpsRules.$inferInsert)[]) {
    try {
      logger.info("IDPS_REPO", `bulkCreateRules - Count: ${dataList?.length}`);
      if (!dataList?.length) throw new Error("Danh sách rules không được trống.");

      const chunkSize = 200; // Số lượng record mỗi lần insert (an toàn cho SQLite)
      const results = [];

      for (let i = 0; i < dataList.length; i += chunkSize) {
        const chunk = dataList.slice(i, i + chunkSize);

        // Thực hiện insert cho từng nhóm nhỏ
        const result = await db
          .insert(idpsRules)
          .values(chunk)
          .returning()
          .all(); // Sử dụng .all() hoặc .execute() tùy cấu hình Drizzle của bạn

        results.push(...result);

        logger.info("IDPS_REPO", `Inserted chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(dataList.length / chunkSize)}`);
      }

      return results;
    } catch (error: any) {
      logger.error("IDPS_REPO", `Bulk create failed: ${error.message}`);
      throw error;
    }
  }

  async updateRule(ruleId: number, data: Partial<typeof idpsRules.$inferInsert>) {
    try {
      logger.info("IDPS_REPO", `updateRule - ruleId: ${ruleId}, Data: ${JSON.stringify(data)}`);

      return await db
        .update(idpsRules)
        .set(data)
        .where(eq(idpsRules.ruleId, ruleId))
        .returning()
        .get();
    } catch (error: any) {
      logger.error("IDPS_REPO", `Failed to updateRule ${ruleId}: ${error.message}`);
      throw error;
    }
  }

  async deleteByRuleId(id: number) {
    try {
      logger.info("IDPS_REPO", `deleteByRuleId - Primary ID: ${id}`);
      const result = await db.delete(idpsRules).where(eq(idpsRules.id, id)).run();
      return result.changes ?? 0;
    } catch (error: any) {
      logger.error("IDPS_REPO", `Failed to deleteByRuleId ${id}: ${error.message}`);
      throw error;
    }
  }

  async bulkDeleteByRuleIds(ids: number[]) {
    try {
      logger.info("IDPS_REPO", `bulkDeleteByRuleIds - Primary IDs: ${JSON.stringify(ids)}`);
      if (!ids?.length) throw new Error("Danh sách ids không được trống.");

      const result = await db.delete(idpsRules).where(inArray(idpsRules.id, ids)).run();
      return result.changes ?? 0;
    } catch (error: any) {
      logger.error("IDPS_REPO", `Bulk delete failed: ${error.message}`);
      throw error;
    }
  }

  async toggleStatus(ruleId: number, newStatus: boolean) {
    try {
      logger.info("IDPS_REPO", `toggleStatus - ruleId: ${ruleId}, NewStatus: ${newStatus}`);

      return await db
        .update(idpsRules)
        .set({ status: newStatus })
        .where(eq(idpsRules.ruleId, ruleId))
        .returning({ ruleId: idpsRules.ruleId, status: idpsRules.status })
        .get();
    } catch (error: any) {
      logger.error("IDPS_REPO", `Failed to toggleStatus rule ${ruleId}: ${error.message}`);
      throw error;
    }
  }

  async bulkUpdateStatus(ids: number[], status: boolean) {
    return await db.update(idpsRules)
      .set({ status })
      .where(inArray(idpsRules.id, ids))
      .run();
  }
}