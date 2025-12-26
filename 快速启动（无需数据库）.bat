@echo off
chcp 65001 >nul
echo ========================================
echo   球搭子网球赛事管理系统
echo   快速启动（无需MySQL数据库）
echo ========================================
echo.

echo [1/2] 检查Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [×] 未安装Node.js
    echo 请访问: https://nodejs.org/ 下载安装
    pause
    exit /b 1
)
echo [√] Node.js已安装

echo.
echo [2/2] 检查依赖...
if not exist "node_modules" (
    echo [*] 正在安装前端依赖（这可能需要几分钟）...
    call npm install
    if %errorlevel% neq 0 (
        echo [×] 依赖安装失败
        pause
        exit /b 1
    )
)

if not exist "backend\node_modules" (
    echo [*] 正在安装后端依赖...
    cd backend
    call npm install
    if %errorlevel% neq 0 (
        echo [×] 后端依赖安装失败
        pause
        exit /b 1
    )
    cd ..
)
echo [√] 依赖已安装

echo.
echo ========================================
echo   启动服务器（简化版，无需MySQL）
echo ========================================
echo.
echo 前端: http://localhost:8080
echo 后端: http://localhost:3000
echo.
echo 默认账号：admin / admin123
echo.
echo 注意：此版本数据保存在内存中，重启后数据会丢失
echo 如需持久化存储，请安装MySQL并使用完整版
echo.
echo 按 Ctrl+C 停止服务器
echo.

call npm start

pause

