@echo off
chcp 65001 >nul
echo ========================================
echo   修复端口占用并重启后端
echo ========================================
echo.

echo [1/3] 停止所有占用3000端口的进程...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo 正在停止进程 %%a...
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 3 >nul
echo [√] 端口3000已释放

echo.
echo [2/3] 停止所有Node进程（确保清理）...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul
echo [√] 所有Node进程已停止

echo.
echo [3/3] 启动后端服务器...
cd backend
start "后端服务器-端口3000" cmd /k "node server-simple.js"
cd ..
echo.
echo ✅ 后端服务器正在启动...
echo.
echo 📋 请查看新打开的后端服务器窗口，应该看到：
echo    - "🚀 服务器运行在 http://localhost:3000"
echo    - "📋 已注册的路由："
echo    - "🔍 实际注册的路由列表："
echo.
echo ⚠️  如果看到 "EADDRINUSE" 错误，说明端口仍被占用
echo    请关闭所有其他Node进程后重试
echo.
pause

