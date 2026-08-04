@echo off
echo --- Installing dependencies for SERVER ---
cd ../../sysnetdef_server
call npm i

echo.
echo --- Installing dependencies for CLIENT ---
cd ../sysnetdef_client
call npm i

echo.
echo --- Process completed!---