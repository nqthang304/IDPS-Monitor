import { Request, Response } from "express";
import { DeviceStorageService } from "./deviceStorage.service";
import { logger } from "@/shared/utils/logger.utils";

export class DeviceStorageController {
  private storageService = new DeviceStorageService();

  /**
   * GET /device/resources
   */
  getResources = async (req: Request, res: Response) => {
    try {
      const data = await this.storageService.getResourceUsage();
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      logger.error("STORAGE_CONTROLLER", `Get resources failed: ${error.message}`);
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  };

  /**
   * GET /device/disk-usage
   */
  getDiskStatus = async (req: Request, res: Response) => {
    try {
      const data = await this.storageService.getDiskUsage();
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: "Failed to read disk info" });
    }
  };

  /**
   * PATCH /device/disk-settings
   */
  updateSettings = async (req: Request, res: Response) => {
    try {
      const { threshold, enableDelete, rotation } = req.body;

      if (threshold === undefined || typeof enableDelete !== 'boolean') {
        return res.status(400).json({ success: false, message: "Invalid input data" });
      }

      const result = await this.storageService.updateDiskSettings({
        threshold,
        enableDelete,
        rotation
      });

      return res.status(200).json({
        success: true,
        message: "Settings updated successfully",
        data: result
      });
    } catch (error: any) {
      logger.error("STORAGE_CONTROLLER", `Update settings failed: ${error.message}`);
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  /**
   * GET /device-storage/logs-retention
   */
  getLogsRetention = async (req: Request, res: Response) => {
    try {
      const data = await this.storageService.getLogsRetention();
      return res.status(200).json({ success: true, status: 200, data });
    } catch (error: any) {
      logger.error("STORAGE_CONTROLLER", `Get logs retention failed: ${error.message}`);
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  /**
   * PUT /device-storage/logs-retention
   */
  updateLogsRetention = async (req: Request, res: Response) => {
    try {
      const { usageLimit, autoClean } = req.body;
      const data = await this.storageService.updateLogsRetention({ usageLimit, autoClean });
      return res.status(200).json({ success: true, status: 200, message: "Logs retention updated successfully", data });
    } catch (error: any) {
      logger.error("STORAGE_CONTROLLER", `Update logs retention failed: ${error.message}`);
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  /**
   * GET /device-storage/activity-settings
   */
  getActivitySettings = async (req: Request, res: Response) => {
    try {
      const data = await this.storageService.getActivitySettings();
      return res.status(200).json({ success: true, status: 200, data });
    } catch (error: any) {
      logger.error("STORAGE_CONTROLLER", `Get activity settings failed: ${error.message}`);
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  /**
   * PUT /device-storage/activity-settings
   */
  updateActivitySettings = async (req: Request, res: Response) => {
    try {
      const { cleanActive, cleanTime } = req.body;
      const data = await this.storageService.updateActivitySettings({ cleanActive, cleanTime });
      return res.status(200).json({ success: true, status: 200, message: "Activity settings updated successfully", data });
    } catch (error: any) {
      logger.error("STORAGE_CONTROLLER", `Update activity settings failed: ${error.message}`);
      return res.status(500).json({ success: false, message: error.message });
    }
  };
}