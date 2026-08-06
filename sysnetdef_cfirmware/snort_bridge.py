import socket
import re
import time
import sys
import os
from datetime import datetime, timedelta

UDS_PATH = "/tmp/sysnetdef_data_idps"
ALERT_FILE = "/var/log/snort/alert"
BASE_LOG_DIR = "/home/idps/server/logs/Log_IDPS"

def clean_timestamp_gmt7(raw_ts):
    """
    Chuyển đổi giờ từ Snort (UTC) sang Giờ Việt Nam (GMT+7 Hanoi)
    VD: "08/06-02:31:21.882018" -> "2026-08-06 09:31:21"
    """
    try:
        if "-" in raw_ts:
            date_part, time_with_ms = raw_ts.split("-")
            time_str = time_with_ms.split(".")[0] # "02:31:21"
            curr_year = datetime.now().year
            
            full_str = f"{curr_year}/{date_part} {time_str}"
            dt = datetime.strptime(full_str, "%Y/%m/%d %H:%M:%S")
            dt_gmt7 = dt + timedelta(hours=7)
            return dt_gmt7.strftime("%Y-%m-%d %H:%M:%S")
    except Exception as e:
        print(f"[Timestamp Error] {e}")
    
    # Dự phòng: Lấy thẳng giờ hệ thống hiện tại
    return time.strftime("%Y-%m-%d %H:%M:%S")

def parse_snort_alert(line):
    pattern = r'(\d{2}/\d{2}-\d{2}:\d{2}:\d{2}\.\d+)\s+\[\*\*\]\s+\[\d+:(\d+):\d+\]\s+(.*?)\s+\[\*\*\]\s+\[Priority:\s+(\d+)\]\s+\{(\w+)\}\s+(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::(\d+))?\s+->\s+(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::(\d+))?'
    match = re.search(pattern, line)
    if match:
        raw_timestamp, sid, rule_msg, priority, protocol, src_ip, src_port, dst_ip, dst_port = match.groups()
        
        # Tự động cộng +7 Giờ (Múi giờ Hà Nội GMT+7) dạng YYYY-MM-DD HH:MM:SS
        timestamp = clean_timestamp_gmt7(raw_timestamp)

        src_port = src_port if src_port else "0"
        dst_port = dst_port if dst_port else "0"
        prio_val = int(priority)
        
        # Action: "Drop" nếu tên luật chứa "drop", còn lại "Alert"
        action = "Drop" if "drop" in rule_msg.lower() else "Alert"
        
        # Malware: Chỉ gán "1" nếu tên luật thực sự chứa từ khóa độc hại
        malware_keywords = ["malware", "trojan", "virus", "backdoor", "botnet", "worm", "ransomware", "spyware", "triton", "trisis", "hatman"]
        rule_lower = rule_msg.lower()
        is_malware = "1" if any(kw in rule_lower for kw in malware_keywords) else "0"
        
        # Severity theo C (gui.c): Normal=1, Alert=2, Drop/Malware=3
        if action == "Normal":
            severity = 1
        elif is_malware == "1" or action == "Drop":
            severity = 3
        else:
            severity = 2
            
        formatted_data = f"{timestamp}|{src_ip}|{dst_ip}|{src_port}|{dst_port}|{action}|{rule_msg}|{severity}|{protocol}|{is_malware}|1|64"
        return formatted_data, action
    return None, None

# Khởi tạo Session Timestamp khi Bridge chạy (khớp với init_idps_session_log trong gui.c)
SESSION_TIMESTAMP = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")

def write_to_log_file(formatted_data, action):
    try:
        if action == "Drop":
            sub_folder = "idps_drop"
        elif action == "Alert":
            sub_folder = "idps_alert"
        else:
            sub_folder = "idps_normal"

        target_dir = os.path.join(BASE_LOG_DIR, sub_folder)
        if not os.path.exists(target_dir):
            os.makedirs(target_dir, exist_ok=True)

        log_file_path = os.path.join(target_dir, f"{SESSION_TIMESTAMP}.log")
        with open(log_file_path, "a") as f:
            f.write(formatted_data + "\n")
    except Exception as e:
        print(f"[Bridge Log Write Error] {e}")

def main():
    print(f"[Bridge] Tailing Snort alert log at {ALERT_FILE}...")
    if not os.path.exists(ALERT_FILE):
        open(ALERT_FILE, 'w').close()

    with open(ALERT_FILE, 'r') as f:
        f.seek(0, os.SEEK_END)
        while True:
            line = f.readline()
            if not line:
                time.sleep(0.1)
                continue
            
            parsed, action = parse_snort_alert(line)
            if parsed:
                write_to_log_file(parsed, action)
                try:
                    client = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
                    client.connect(UDS_PATH)
                    client.sendall((parsed + "\n").encode('utf-8'))
                    client.close()
                    print(f"[Bridge GMT+7 Saved & Pushed] {parsed}")
                except Exception as e:
                    print(f"[Bridge UDS Error] Backend socket not ready: {e}")

if __name__ == "__main__":
    main()
