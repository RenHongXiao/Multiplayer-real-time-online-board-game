@echo off
chcp 65001 >nul
set PATH=D:\nodejs;%PATH%
cd /d "%~dp0server"
echo Starting backend server on http://localhost:3000
npx tsx src/index.ts
pause
