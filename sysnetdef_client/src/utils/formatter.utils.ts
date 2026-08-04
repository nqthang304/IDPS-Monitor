
export const bitFormatter = (bits: number | null | undefined): string => {
    if (!bits || bits === 0) return "0 b";
    
    const k = 1000;
    const sizes = ["b", "Kb", "Mb", "Gb", "Tb", "Pb"];
    
    // Tìm ra bậc của đơn vị (0: b, 1: Kb, 2: Mb...)
    const i = Math.floor(Math.log(Math.abs(bits)) / Math.log(k));
    
    // Xử lý trường hợp bits quá nhỏ
    if (i < 0) return `${bits} b`;

    // Làm tròn đến 2 chữ số thập phân
    const formattedValue = parseFloat((bits / Math.pow(k, i)).toFixed(2));
    
    return `${formattedValue} ${sizes[i]}`;
};

/**
 * Hàm quy đổi Bytes (Dùng cho dung lượng file: B, KB, MB, GB)
 */
export const byteFormatter = (bytes: number | null | undefined): string => {
    if (!bytes || bytes === 0) return "0 B";
    
    const k = 1024;
    const sizes = ["B", "Kb", "Mb", "Gb", "Tb", "Pb", "Eb", "Zb", "Yb"];
    
    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
    
    if (i <= 0) return `${bytes} B`;

    const formattedValue = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
    
    return `${formattedValue} ${sizes[i]}`;
};

/**
 * Hàm quy đổi Số lượng đếm (Dùng cho đếm số gói tin Packet: 1.5K, 2M)
 */
export const cntFormatter = (count: number | null | undefined): string => {
    if (!count || count === 0) return "0 p";
    
    const absCount = Math.abs(count);
    if (absCount >= 1000000000000) {
        return (count / 1000000000000).toFixed(2) + " Tp"; // Trillion
    }
    if (absCount >= 1000000000) {
        return (count / 1000000000).toFixed(2) + " Bp"; // Tỷ (Billion)
    }
    if (absCount >= 1000000) {
        return (count / 1000000).toFixed(2) + " Mp"; // Triệu (Million)
    }
    if (absCount >= 1000) {
        return (count / 1000).toFixed(2) + " Kp"; // Nghìn (Kilo)
    }
    
    return count.toString() + " p"; // Dưới 1000 thì giữ nguyên
};

/**
 * Định nghĩa cấu trúc cho dữ liệu thời gian trong profile
 */
interface TimeRange {
  start?: string | number | Date;
  end?: string | number | Date | null;
}

/**
 * Hàm định dạng ngày tháng đơn giản (DD/MM/YYYY)
 */
export const formatDate = (dateInput: string | number | Date): string => {
  const d = new Date(dateInput);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Hàm tính toán thời lượng sử dụng từ chuỗi JSON
 */
export const profileTimeFormatter = (timeString: string | null | undefined): string => {
  try {
    let totalDurationMs = 0;
    if (!timeString) {
      return "Not used yet";
    }

    const timeData: TimeRange[] = JSON.parse(timeString);

    if (timeData.length === 0) {
      return "No data";
    }

    let lastEnd: string | number | Date | null | undefined = null;

    for (const { start, end } of timeData) {
      if (end === undefined || end === null) {
        return start ? `In used, since: ${start}` : "In used";
      }

      const startTime = start ? new Date(start).getTime() : new Date().getTime();
      const endTime = end ? new Date(end).getTime() : new Date().getTime();

      totalDurationMs += (endTime - startTime);
      lastEnd = end;
    }

    const totalSeconds = Math.round(totalDurationMs / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);

    const lastUsedStr = lastEnd ? lastEnd.toString() : "";

    if (totalDays > 0) {
      return `${totalDays} days, last used: ${lastUsedStr}`;
    } else if (totalHours > 0) {
      return `${totalHours} hours, last used: ${lastUsedStr}`;
    } else if (totalMinutes > 0) {
      return `${totalMinutes} minutes, last used: ${lastUsedStr}`;
    } else {
      return `${totalSeconds} seconds, last used: ${lastUsedStr}`;
    }
  } catch (error) {
    return "Invalid time data";
  }
};

/**
 * Hàm định dạng thời gian từ timestamp (Dùng cho biểu đồ)
 */
export const timeFormatter = (timeInput: string | number | undefined): string => {
  try {
    if (!timeInput) return "Chưa sử dụng";

    let date: Date;

    if (typeof timeInput === "number") {
      let timestamp = timeInput;
      if (timestamp < 10000000000) {
        timestamp *= 1000;
      }
      date = new Date(timestamp);
    } else if (typeof timeInput === "string") {
      const trimmed = timeInput.trim();
      // Nếu là chuỗi số thuần túy (e.g. "1712345678")
      if (/^\d+$/.test(trimmed)) {
        let timestamp = parseInt(trimmed, 10);
        if (timestamp < 10000000000) {
          timestamp *= 1000;
        }
        date = new Date(timestamp);
      } else {
        // Chuỗi dạng "YYYY-MM-DD HH:mm:ss" hoặc ISO string
        const normalized = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");
        date = new Date(normalized);
      }
    } else {
      return "Dữ liệu thời gian lỗi";
    }

    if (isNaN(date.getTime())) {
      return String(timeInput);
    }

    const pad = (n: number) => String(n).padStart(2, "0");
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    return String(timeInput || "Dữ liệu thời gian lỗi");
  }
};