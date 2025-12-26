@echo off
chcp 65001 >nul
echo ========================================
echo   立即重启后端服务器
echo ========================================
echo.

echo [1/2] 停止现有后端服务器...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 >nul
echo [√] 已停止

echo.
echo [2/2] 启动后端服务器...
cd backend
start "后端服务器-端口3000" cmd /k "node server-simple.js"
cd ..
echo.
echo ✅ 后端服务器已启动
echo 📍 地址: http://localhost:3000
echo.
echo 请查看后端控制台，应该看到：
echo   - "🚀 服务器运行在 http://localhost:3000"
echo   - "📋 已注册的路由："
echo   - "🔍 路由注册测试："
echo.
echo 如果看到这些信息，说明路由已正确注册
echo.
pause

