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
    VD: 18:59:25 UTC -> 01:59:25 GMT+7
    """
    try:
        if "-" in raw_ts:
            time_str = raw_ts.split("-")[1].split(".")[0] # "18:59:25"
            dt = datetime.strptime(time_str, "%H:%M:%S")
            dt_gmt7 = dt + timedelta(hours=7)
            return dt_gmt7.strftime("%H:%M:%S")
    except Exception as e:
        print(f"[Timestamp Error] {e}")
    
    # Dự phòng: Lấy thẳng giờ hệ thống hiện tại
    return time.strftime("%H:%M:%S")

def parse_snort_alert(line):
    pattern = r'(\d{2}/\d{2}-\d{2}:\d{2}:\d{2}\.\d+)\s+\[\*\*\]\s+\[\d+:(\d+):\d+\]\s+(.*?)\s+\[\*\*\]\s+\[Priority:\s+(\d+)\]\s+\{(\w+)\}\s+(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::(\d+))?\s+->\s+(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::(\d+))?'
    match = re.search(pattern, line)
    if match:
        raw_timestamp, sid, rule_msg, priority, protocol, src_ip, src_port, dst_ip, dst_port = match.groups()
        
        # Tự động cộng +7 Giờ (Múi giờ Hà Nội GMT+7)
        timestamp = clean_timestamp_gmt7(raw_timestamp)

        src_port = src_port if src_port else "0"
        dst_port = dst_port if dst_port else "0"
        prio_val = int(priority)
        
        action = "Drop" if "Drop" in rule_msg or prio_val == 0 else "Alert"
        is_malware = "1" if prio_val == 0 or "Malware" in rule_msg or "Drop" in action else "0"
        rule_clean = rule_msg.replace(" ", "_")
        
        formatted_data = f"{timestamp}|{src_ip}|{dst_ip}|{src_port}|{dst_port}|{action}|{rule_clean}|{prio_val}|{protocol}|{is_malware}|1|64"
        return formatted_data, action
    return None, None

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

        today = time.strftime("%Y-%m-%d")
        log_file_path = os.path.join(target_dir, f"{today}.log")
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
