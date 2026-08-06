import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { message } from 'antd';

export interface LogFileData {
  id: string;
  fileName: string;
  [key: string]: any;
}

/**
 * Hàm xử lý riêng cho nội dung log của IDPS
 * Cấu trúc: Time|SrcIP|DstIP|SrcPort|DstPort|Class|Description|Priority|Protocol|...|SID
 */
export const parseIdpsLogToExcel = (textContent: string) => {
  const headers = [
    "Time", "Priority", "Protocol", "Class", 
    "SrcIP", "SrcPORT", "DstIP", "DstPort", 
    "SID", "Description"
  ];

  const rows = textContent.split('\n')
    .filter(line => line.trim() !== '')
    .map(line => {
      const parts = line.split('|');
      return [
        parts[0] || "",  // Time
        parts[7] || "",  // Priority
        parts[8] || "",  // Protocol
        parts[5] || "",  // Class
        parts[1] || "",  // SrcIP
        parts[3] || "",  // SrcPORT
        parts[2] || "",  // DstIP
        parts[4] || "",  // DstPort
        parts[10] || "", // SID
        parts[6] || ""   // Description
      ];
    });

  return { headers, rows };
};

export const processLogExport = async (
  selectedRows: LogFileData[], 
  format: string,
  logType: 'IDPS' | 'DDOS' | 'IPSEC' | 'DEVICE', // Thêm các loại log khác ở đây
  fetchFileContent: (fileId: string) => Promise<Blob>
) => {
  const zip = new JSZip();
  const isZip = format.includes('zip');

  for (const file of selectedRows) {
    const originalBlob = await fetchFileContent(file.id);
    const textContent = await originalBlob.text();

    let finalContent: any = textContent;
    let extension = '.txt';

    if (format.includes('xlsx')) {
      extension = '.xlsx';
      
      let headers: string[] = [];
      let rows: any[][] = [];

      switch (logType) {
        case 'IDPS': {
          const parsed = parseIdpsLogToExcel(textContent);
          headers = parsed.headers;
          rows = parsed.rows;
          break;
        }
        default: {
          headers = ["Log Content"];
          rows = textContent.split('\n').filter(line => line.trim() !== '').map(line => [line]);
        }
      }

      const totalRows = rows.length;
      const MAX_EXCEL_ROWS = 100000; // Giới hạn an toàn 100,000 dòng cho Client JS Excel Export

      if (totalRows > MAX_EXCEL_ROWS) {
        message.warning(
          `File log "${file.fileName}" có ${totalRows.toLocaleString()} dòng quá lớn đối với Excel. Đã giới hạn xuất ${MAX_EXCEL_ROWS.toLocaleString()} dòng đầu tiên. Hãy xuất dạng .txt hoặc .zip-txt để lấy toàn bộ log!`,
          7
        );
        rows = rows.slice(0, MAX_EXCEL_ROWS);
      }

      try {
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows], { dense: true } as any);
        
        if (logType === 'IDPS') {
          worksheet['!cols'] = [
            { wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, 
            { wch: 25 }, { wch: 10 }, { wch: 25 }, { wch: 10 }, 
            { wch: 10 }, { wch: 30 }
          ];
        }

        XLSX.utils.book_append_sheet(workbook, worksheet, "Logs");
        finalContent = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      } catch (err) {
        console.error("XLSX export error:", err);
        message.error(`Không thể chuyển đổi file "${file.fileName}" sang Excel do dung lượng quá lớn. Vui lòng xuất dạng .txt hoặc .zip-txt!`);
        throw err;
      }
    }

    const fileName = `${file.fileName.split('.')[0]}${extension}`;

    if (isZip) {
      zip.file(fileName, finalContent);
    } else {
      const fileBlob = new Blob([finalContent], { 
        type: extension === '.xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/plain' 
      });
      saveAs(fileBlob, fileName);
      if (selectedRows.length > 1) await new Promise(r => setTimeout(r, 500));
    }
  }

  if (isZip) {
    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `${logType.toLowerCase()}_logs_${Date.now()}.zip`);
  }
};