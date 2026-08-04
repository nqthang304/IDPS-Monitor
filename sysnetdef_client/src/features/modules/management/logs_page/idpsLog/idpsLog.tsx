import LogTableContainer from "@/features/modules/management/logs_page/logTableContainer/logTableContainer";
import { logApi } from "@/features/modules/management/services/api/management.api";
import { message } from "antd";
import { useEffect, useState } from "react";
import { byteFormatter } from "@/utils/formatter.utils";
import { processLogExport } from "@/utils/logExport.utils";

interface TabConfig {
  key: string;
  label: string;
  data: any[];
}

const IDPSLogs = () => {
  const [tabsConfig, setTabsConfig] = useState<TabConfig[]>([
    { key: 'normal', label: 'Normal', data: [] },
    { key: 'alert', label: 'Alert', data: [] },
    { key: 'drop', label: 'Drop', data: [] },
  ]);

  const [loading, setLoading] = useState(false);

  const fetchLogFiles = async () => {
    setLoading(true);
    try {
      const [resNormal, resAlert, resDrop] = await Promise.all([
        logApi.getIDPSLogFiles('normal'),
        logApi.getIDPSLogFiles('alert'),
        logApi.getIDPSLogFiles('drop')
      ]);

      const mapData = (res: any) => res?.data?.map((item: any) => ({
        ...item,
        id: item.fileId,
        name: item.fileName,
        size: byteFormatter(item.size)
      })) || [];

      setTabsConfig([
        { key: 'normal', label: 'Normal', data: mapData(resNormal) },
        { key: 'alert', label: 'Alert', data: mapData(resAlert) },
        { key: 'drop', label: 'Drop', data: mapData(resDrop) },
      ]);
    } catch (error) {
      message.error("Error occurred while fetching log files");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogFiles();
  }, []);

  // Thêm tham số onClear nhận được từ LogTableContainer
  const handleExport = async (selectedRows: any[], format: string, onClear: () => void) => {
    if (selectedRows.length === 0) {
      message.warning("Please select a file");
      return;
    }

    const hide = message.loading(`Exporting IDPS data (${format})...`, 0);

    try {
      await processLogExport(
        selectedRows,
        format,
        'IDPS',
        async (id) => {
          const res: any = await logApi.downloadLogFile(id, 'raw');
          
          // Bộ lọc an toàn (Defensive Check):
          // Do interceptor của bạn bóc tách lấy rawData, hãy xem res lúc này là gì:
          // 1. Nếu res đã là instance của Blob, trả về luôn.
          // 2. Nếu res là object chứa thuộc tính data (ví dụ res.data là Blob), lấy res.data.
          // 3. Nếu không phải cả hai, cố gắng bọc nó lại thành một Blob text.
          if (res instanceof Blob) {
            return res;
          } else if (res && res.data instanceof Blob) {
            return res.data;
          } else if (res) {
            // Trường hợp xấu nhất: API trả về string/object thay vì blob, tự chuyển sang Blob text
            const content = typeof res === 'object' ? JSON.stringify(res) : String(res);
            return new Blob([content], { type: 'text/plain' });
          }
          
          throw new Error("Unable to read file data from Server.");
        }
      );

      message.success("Export successfully");
      
      // Thực hiện xóa các dòng đã chọn trên UI
      onClear(); 

    } catch (error) {
      console.error(error);
      message.error("Error occurred while processing IDPS data export");
    } finally {
      hide();
    }
  };

  return (
    <div style={{ opacity: loading ? 0.7 : 1 }}>
      <LogTableContainer tabs={tabsConfig} onExport={handleExport} />
    </div>
  );
};

export default IDPSLogs;