@echo off
echo Starting server and client in Windows Terminal...
set BASE_PATH=%~dp0../..
wt -w 0 ^
    nt --title "SERVER" cmd /k "cd /d %BASE_PATH%/sysnetdef_server && npm run build" ^
    ; nt --title "CLIENT" cmd /k "cd /d %BASE_PATH%/sysnetdef_client && npm run build"
echo All processes started in Windows Terminal!