@echo off
chcp 65001 >nul
echo ========================================
echo   球搭子网球赛事管理系统 - 开发模式
echo ========================================
echo.

echo [1/3] 检查Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [×] 未安装Node.js，请先安装：https://nodejs.org/
    pause
    exit /b 1
)
echo [√] Node.js已安装

echo.
echo [2/3] 检查依赖...
if not exist "node_modules" (
    echo [*] 正在安装前端依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo [×] 前端依赖安装失败
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
echo [3/3] 启动开发服务器...
echo.
echo 前端: http://localhost:8080
echo 后端: http://localhost:3000
echo.
echo 按 Ctrl+C 停止服务器
echo.

call npm start

pause

