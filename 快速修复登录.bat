@echo off
chcp 65001 >nul
echo ========================================
echo   修复登录问题并重启服务器
echo ========================================
echo.

echo [1/3] 停止现有服务器...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul
echo [√] 已停止

echo.
echo [2/3] 检查配置...
if not exist "node_modules" (
    echo [*] 安装依赖...
    call npm install
)
if not exist "backend\node_modules" (
    echo [*] 安装后端依赖...
    cd backend
    call npm install
    cd ..
)
echo [√] 依赖检查完成

echo.
echo [3/3] 启动服务器...
echo.
echo ✅ 已修复的问题：
echo    - Vite代理配置（保留/api前缀）
echo    - 内置账号已创建
echo.
echo 📋 内置账号：
echo    管理员：admin / admin123
echo    用户1：user1 / user123
echo    用户2：user2 / user123
echo    用户3：user3 / user123
echo.
echo 🌐 访问地址：
echo    前端: http://localhost:8080
echo    后端: http://localhost:3000
echo.
echo 按 Ctrl+C 停止服务器
echo.

call npm start

pause

