@echo off
chcp 65001 >nul
echo ========================================
echo   重启后端服务器（修复批量添加404）
echo ========================================
echo.

echo [1/2] 停止现有后端服务器...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *server*" >nul 2>&1
timeout /t 2 >nul
echo [√] 已停止

echo.
echo [2/2] 启动后端服务器...
cd backend
start "后端服务器" cmd /k "node server-simple.js"
cd ..
echo.
echo ✅ 后端服务器已启动
echo 📍 地址: http://localhost:3000
echo.
echo 请在前端重新测试批量添加功能
pause

