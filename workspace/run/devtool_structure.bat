@echo off
setlocal enabledelayedexpansion

:: ==========================================
:: 1. CẤU HÌNH ĐƯỜNG DẪN CỨNG (Sửa ở đây)
:: ==========================================
set "SOURCE_DIR=D:\Acronics\src_code\GUI_Firewall_v2\sysnetdef_client"
set "OUTPUT_FILE=D:\Acronics\src_code\GUI_Firewall_v2\workspace\run\structure.txt"

:: ==========================================
:: 2. DANH SÁCH THƯ MỤC/FILE CẦN BỎ QUA
:: (Dùng dấu cách để phân tách)
:: ==========================================
set "EXCLUDE=node_modules .git .vscode dist build .DS_Store"

:: Kiểm tra thư mục nguồn
if not exist "%SOURCE_DIR%" (
    echo [ERROR] Khong tim thay thu muc nguon: %SOURCE_DIR%
    pause
    exit /b
)

echo Dang quet cau truc tai: %SOURCE_DIR%
echo Vui long cho trong giay lat...

:: Khởi tạo file xuất (Ghi đè file cũ)
echo Project Structure > "%OUTPUT_FILE%"
echo ================= >> "%OUTPUT_FILE%"
echo %SOURCE_DIR% >> "%OUTPUT_FILE%"

:: Gọi hàm đệ quy để quét thư mục
call :ListFolder "%SOURCE_DIR%" ""

echo.
echo ==========================================
echo [THANH CONG] Da luu tai: %OUTPUT_FILE%
echo ==========================================
pause
goto :eof

:: ==========================================
:: HÀM XỬ LÝ ĐỆ QUY (Recursive Function)
:: ==========================================
:ListFolder
set "current_dir=%~1"
set "indent=%~2"

:: Lấy danh sách các mục trong thư mục hiện tại
for /f "delims=" %%i in ('dir /b /o:gn "%current_dir%"') do (
    set "item_name=%%i"
    set "skip=0"

    :: Kiểm tra xem item có nằm trong danh sách loại trừ không
    for %%e in (%EXCLUDE%) do (
        if /i "!item_name!"=="%%e" set "skip=1"
    )

    if "!skip!"=="0" (
        if exist "%current_dir%\%%i\" (
            :: Nếu là thư mục
            echo %indent%├── %%i/ >> "%OUTPUT_FILE%"
            call :ListFolder "%current_dir%\%%i" "  %indent%│"
        ) else (
            :: Nếu là file
            echo %indent%└── %%i >> "%OUTPUT_FILE%"
        )
    )
)
goto :eof