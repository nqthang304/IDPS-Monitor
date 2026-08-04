@echo off
setlocal

:: Cấu hình đường dẫn nguồn và đích cho Server
set SERVER_SRC=..\..\..\sysnetdef_env\server\.env
set SERVER_DEST=..\..\sysnetdef_server\

:: Cấu hình đường dẫn nguồn và đích cho Client
set CLIENT_SRC=..\..\..\sysnetdef_env\client\.env
set CLIENT_DEST=..\..\sysnetdef_client\

echo ------------------------------------------
echo Dang kiem tra va copy file .env...
echo ------------------------------------------

:: Xử lý cho Server
if exist "%SERVER_SRC%" (
    echo [FOUND] Dang copy .env vao Server...
    copy /y "%SERVER_SRC%" "%SERVER_DEST%"
) else (
    echo [SKIP] Khong tim thay file .env tai: %SERVER_SRC%
)

echo.

:: Xử lý cho Client
if exist "%CLIENT_SRC%" (
    echo [FOUND] Dang copy .env vao Client...
    copy /y "%CLIENT_SRC%" "%CLIENT_DEST%"
) else (
    echo [SKIP] Khong tim thay file .env tai: %CLIENT_SRC%
)

echo ------------------------------------------
echo Hoan tat!
echo ------------------------------------------