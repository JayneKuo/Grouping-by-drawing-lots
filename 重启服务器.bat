@echo off
chcp 65001 >nul
echo ========================================
echo   重启服务器（修复登录问题）
echo ========================================
echo.

echo [1/2] 停止现有服务器...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul
echo [√] 已停止

echo.
echo [2/2] 启动服务器...
echo.
echo 前端: http://localhost:8080
echo 后端: http://localhost:3000
echo.
echo 按 Ctrl+C 停止服务器
echo.

call npm start

pause

