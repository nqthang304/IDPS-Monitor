import { db } from "../../core/database/drizzle";
import { systemConfigs } from "../schema/systemConfig.model";
import { eq, inArray } from "drizzle-orm";
import { format } from 'date-fns';
import { logger } from "@/shared/utils/logger.utils"; // Giả định đường dẫn logger của bạn

export class SystemConfigRepository {
  
  private getCurrentTime() {
    return format(new Date(), 'yyyy/MM/dd HH:mm:ss');
  }

  // 1. Lấy tất cả cấu hình
  async findAll() {
    try {
      const results = await db.select().from(systemConfigs).all();
      logger.info("SYS_CONFIG", `Fetched all configurations (${results.length} items)`);
      return results;
    } catch (error: any) {
      logger.error("SYS_CONFIG", `Error [findAll]: ${error.message}`);
      throw error;
    }
  }

  // 2. Lấy giá trị theo Key
  async findByKey(key: string) {
    try {
      const result = await db
        .select()
        .from(systemConfigs)
        .where(eq(systemConfigs.key, key))
        .get();
      
      if (result) {
        logger.info("SYS_CONFIG", `Config found for key: ${key}`);
      } else {
        logger.info("SYS_CONFIG", `No config found for key: ${key}`);
      }
      return result;
    } catch (error: any) {
      logger.error("SYS_CONFIG", `Error [findByKey] for key ${key}: ${error.message}`);
      throw error;
    }
  }

  // 3. Cập nhật hoặc tạo mới cấu hình (Upsert)
  async setConfig(key: string, value: string, description?: string) {
    try {
      const now = this.getCurrentTime();
      const existing = await this.findByKey(key);

      if (existing) {
        await db.update(systemConfigs)
          .set({ 
            value: value, 
            description: description ?? existing.description,
            updatedAt: now 
          })
          .where(eq(systemConfigs.key, key))
          .run();
        
        logger.success("SYS_CONFIG", `Updated config: [${key}] = ${value}`);
      } else {
        await db.insert(systemConfigs)
          .values({
            key,
            value,
            description: description ?? 'No desc',
            updatedAt: now
          })
          .run();
        
        logger.success("SYS_CONFIG", `Created new config: [${key}] = ${value}`);
      }
      return true;
    } catch (error: any) {
      logger.error("SYS_CONFIG", `Error [setConfig] for key ${key}: ${error.message}`);
      throw error;
    }
  }

  // 4. Lấy nhiều cấu hình cùng lúc
  async getMultipleConfigs(keys: string[]) {
    try {
      // Tối ưu hóa: Sử dụng inArray thay vì filter sau khi lấy tất cả
      const results = await db
        .select()
        .from(systemConfigs)
        .where(inArray(systemConfigs.key, keys))
        .all();
        
      logger.info("SYS_CONFIG", `Bulk fetched configs for keys: [${keys.join(", ")}] - Found: ${results.length}`);
      return results;
    } catch (error: any) {
      logger.error("SYS_CONFIG", `Error [getMultipleConfigs]: ${error.message}`);
      throw error;
    }
  }

  // 5. Xóa một cấu hình
  async deleteConfig(key: string) {
    try {
      const result = await db
        .delete(systemConfigs)
        .where(eq(systemConfigs.key, key))
        .run();
      
      if (result.changes > 0) {
        logger.success("SYS_CONFIG", `Deleted config key: ${key}`);
      } else {
        logger.info("SYS_CONFIG", `Attempted to delete key ${key} but it didn't exist`);
      }
      return result.changes;
    } catch (error: any) {
      logger.error("SYS_CONFIG", `Error [deleteConfig] for key ${key}: ${error.message}`);
      throw error;
    }
  }
}