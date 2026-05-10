@echo off
chcp 65001 >nul
echo ============================================
echo   Board Game Platform - One Click Start
echo ============================================
echo.
echo [1/3] Starting MongoDB...
netstat -an | findstr "27017" >nul
if %errorlevel% neq 0 (
    echo   MongoDB not running, starting...
    start /B "" "C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe" --dbpath "D:\mongodb-data"
    echo   Waiting 3 seconds...
    timeout /t 3 /nobreak >nul
) else (
    echo   MongoDB already running
)

echo.
echo [2/3] Starting backend server...
start "BoardGameServer" cmd /c "set PATH=D:\nodejs;%%PATH%% && cd /d %~dp0server && npx tsx src/index.ts"
echo   Backend: http://localhost:3000

echo.
echo [3/3] Starting frontend dev server...
start "BoardGameClient" cmd /c "set PATH=D:\nodejs;%%PATH%% && cd /d %~dp0client && npx vite"
echo   Frontend: http://localhost:5173

echo.
echo ============================================
echo   All services started!
echo   Open http://localhost:5173 in browser
echo ============================================
echo.
pause
