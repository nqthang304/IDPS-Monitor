import { AuditLogRepository, CreateAuditLogDto } from "#/database/repository/auditLog.repository";
import { logger } from "#/shared/utils/logger.utils";

const auditLogRepo = new AuditLogRepository();

export class AuditLogger {
  /**
   * Ghi log vết hệ thống (Audit Log)
   */
  static async log(data: CreateAuditLogDto) {
    try {
      await auditLogRepo.create(data);
      logger.info("AUDIT_LOG", `[${data.action}] User: ${data.username} | Status: ${data.status} | Details: ${data.result || 'N/A'}`);
    } catch (error: any) {
      logger.error("AUDIT_LOG", `Failed to record audit log: ${error?.message || error}`);
    }
  }

  /**
   * Helper: Ghi vết Đăng nhập
   */
  static async logLogin(userId: number, username: string, status: 'SUCCESS' | 'FAILED', resultDetails?: string) {
    return this.log({
      userId,
      username,
      action: 'USER_LOGIN',
      status,
      result: resultDetails || (status === 'SUCCESS' ? 'Login successful' : 'Login failed'),
    });
  }

  /**
   * Helper: Ghi vết Cấu hình Rules mới
   */
  static async logCreateRule(userId: number, username: string, ruleId: number, status: 'SUCCESS' | 'FAILED', details?: string) {
    return this.log({
      userId,
      username,
      action: 'CREATE_RULE',
      status,
      result: details || `Created Rule #${ruleId}`,
    });
  }

  /**
   * Helper: Ghi vết Cập nhật / Sửa Rule
   */
  static async logUpdateRule(userId: number, username: string, ruleId: number, status: 'SUCCESS' | 'FAILED', details?: string) {
    return this.log({
      userId,
      username,
      action: 'UPDATE_RULE',
      status,
      result: details || `Updated Rule #${ruleId}`,
    });
  }

  /**
   * Helper: Ghi vết Bật / Tắt trạng thái Rule
   */
  static async logToggleRuleStatus(userId: number, username: string, ruleId: number, newStatus: boolean, status: 'SUCCESS' | 'FAILED', details?: string) {
    const actionText = newStatus ? 'ENABLE_RULE' : 'DISABLE_RULE';
    return this.log({
      userId,
      username,
      action: actionText,
      status,
      result: details || `${actionText} for Rule #${ruleId}`,
    });
  }

  /**
   * Helper: Ghi vết Bật / Tắt trạng thái Rule hàng loạt
   */
  static async logBulkToggleRuleStatus(userId: number, username: string, ruleIds: number[], newStatus: boolean, status: 'SUCCESS' | 'FAILED', details?: string) {
    const actionText = newStatus ? 'BULK_ENABLE_RULES' : 'BULK_DISABLE_RULES';
    return this.log({
      userId,
      username,
      action: actionText,
      status,
      result: details || `${actionText} for Rules: [${ruleIds.join(', ')}]`,
    });
  }

  /**
   * Helper: Ghi vết Xóa Rule
   */
  static async logDeleteRules(userId: number, username: string, ruleIds: number[], status: 'SUCCESS' | 'FAILED', details?: string) {
    return this.log({
      userId,
      username,
      action: 'DELETE_RULES',
      status,
      result: details || `Deleted Rules: [${ruleIds.join(', ')}]`,
    });
  }

  /**
   * Helper: Ghi vết Import Rules từ File
   */
  static async logImportRules(userId: number, username: string, count: number, status: 'SUCCESS' | 'FAILED', details?: string) {
    return this.log({
      userId,
      username,
      action: 'IMPORT_RULES_FILE',
      status,
      result: details || `Imported ${count} rules from file`,
    });
  }

  /**
   * Helper: Ghi vết Thay đổi trạng thái hệ thống IDPS (ON/OFF, Mode)
   */
  static async logUpdateSystemStatus(userId: number, username: string, active: boolean, mode: string, status: 'SUCCESS' | 'FAILED', details?: string) {
    return this.log({
      userId,
      username,
      action: 'UPDATE_SYSTEM_STATUS',
      status,
      result: details || `Set IDPS Status: ${active ? 'ON' : 'OFF'}, Mode: ${mode}`,
    });
  }
}
