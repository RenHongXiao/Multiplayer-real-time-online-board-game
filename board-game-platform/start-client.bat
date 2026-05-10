@echo off
chcp 65001 >nul
set PATH=D:\nodejs;%PATH%
cd /d "%~dp0client"
echo Starting frontend dev server on http://localhost:5173
npx vite
pause
