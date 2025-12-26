@echo off
chcp 65001 >nul
echo ========================================
echo   本地测试环境启动脚本
echo ========================================
echo.

echo [1/3] 检查Node.js环境...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未找到Node.js，请先安装Node.js
    pause
    exit /b 1
)
echo ✅ Node.js已安装

echo.
echo [2/3] 检查依赖...
if not exist "backend\node_modules\" (
    echo 📦 安装后端依赖...
    cd backend
    call npm install
    cd ..
)
if not exist "node_modules\" (
    echo 📦 安装前端依赖...
    call npm install
)
echo ✅ 依赖已就绪

echo.
echo [3/3] 启动服务...
echo.
echo 🚀 正在启动本地API服务器（端口3001）...
start "本地API服务器" cmd /k "cd backend && node server-local-api.js"

timeout /t 2 /nobreak >nul

echo 🚀 正在启动前端开发服务器（端口8080）...
start "前端开发服务器" cmd /k "npm run dev"

echo.
echo ========================================
echo   启动完成！
echo ========================================
echo.
echo 📡 本地API服务器: http://localhost:3001
echo 🌐 前端应用: http://localhost:8080
echo.
echo 💡 提示:
echo   - 数据会保存在 backend\local-data.json
echo   - 关闭窗口即可停止服务器
echo   - 测试完成后，可以推送到GitHub部署到Vercel
echo.
pause

