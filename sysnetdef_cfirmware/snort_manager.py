import socket
import subprocess
import time

HOST = "127.0.0.1"
PORT = 3367

def stop_snort():
    print("[Manager] Executing force stop ONLY for Snort binary...")
    subprocess.run("sudo pkill -9 -x snort", shell=True, stderr=subprocess.DEVNULL)
    subprocess.run("sudo pkill -9 -f '^/usr/sbin/snort'", shell=True, stderr=subprocess.DEVNULL)
    print("[Manager] Snort process stopped completely.")

def start_snort(mode="IDS"):
    print(f"[Manager] Starting Snort process in {mode} mode...")
    stop_snort()
    time.sleep(1)
    
    # Bật card mạng thứ 2 trước khi chạy
    subprocess.run("sudo ip link set ens37 up", shell=True, stderr=subprocess.DEVNULL)
    
    if mode == "IPS":
        # Chế độ IPS Inline ngắt gói tin thực tế giữa 2 card mạng ens33 và ens37
        cmd = "sudo /usr/sbin/snort -m 027 -D -d -A fast -l /var/log/snort -u snort -g snort --pid-path /run/snort/ -c /etc/snort/snort.conf -S 'HOME_NET=[192.168.70.0/24]' -Q --daq afpacket -i ens33:ens37"
    else:
        # Chế độ IDS Lắng nghe
        cmd = "sudo /usr/sbin/snort -m 027 -D -d -A fast -l /var/log/snort -u snort -g snort --pid-path /run/snort/ -c /etc/snort/snort.conf -S 'HOME_NET=[192.168.70.0/24]' -i ens33"
        
    subprocess.run(cmd, shell=True)
    print(f"[Manager] Snort process started in {mode} mode successfully.")

def reload_snort():
    print("[Manager] Reloading Snort rules...")
    subprocess.run("sudo pkill -HUP -x snort", shell=True)
    print("[Manager] Snort rules reloaded.")

def main():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        server.bind((HOST, PORT))
        server.listen(5)
        print(f"[Manager] Listening for Backend commands on {HOST}:{PORT}...")
    except Exception as e:
        print(f"[Manager Bind Error] {e}")
        return

    while True:
        try:
            conn, addr = server.accept()
            data = conn.recv(1024).decode('utf-8').strip()
            print(f"\n[Manager Command Received] '{data}'")

            mode = "IPS" if "IDPS_MODE$IPS" in data else "IDS"

            if "IDPS_EN_DIS$1" in data:
                start_snort(mode)
            elif "IDPS_EN_DIS$0" in data:
                stop_snort()
            elif "IDPS_RULES_UPDATE" in data or "IDPS_UPDATE" in data:
                reload_snort()

            response = f"{data}$OK$"
            conn.sendall(response.encode('utf-8'))
                
            conn.close()
        except Exception as e:
            print(f"[Manager Loop Error] {e}")

if __name__ == "__main__":
    main()
