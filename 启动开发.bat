@echo off
chcp 65001 >nul
echo ========================================
echo   启动开发服务器
echo ========================================
echo.

echo [1/2] 检查依赖...
if not exist "node_modules\" (
    echo 📦 安装依赖...
    call npm install
)
echo ✅ 依赖已就绪

echo.
echo [2/2] 启动开发服务器...
echo.
echo 🚀 正在启动前端开发服务器（端口8080）...
echo 🌐 访问: http://localhost:8080
echo.
echo 💡 提示: 按 Ctrl+C 停止服务器
echo.

call npm run dev
