@echo off
chcp 65001 >nul
echo ========================================
echo   球搭子网球赛事管理系统 - 一键启动
echo ========================================
echo.

echo [1/3] 检查Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [×] 未安装Node.js
    echo 请访问: https://nodejs.org/ 下载安装
    pause
    exit /b 1
)
echo [√] Node.js已安装

echo.
echo [2/3] 检查依赖...
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
echo [3/3] 检查数据库配置...
if not exist "backend\.env" (
    echo [*] 创建数据库配置文件...
    copy backend\.env.example backend\.env >nul
    echo [√] 配置文件已创建
    echo.
    echo ⚠️  请先配置数据库：
    echo 1. 编辑 backend\.env 文件
    echo 2. 填入MySQL密码
    echo 3. 运行 自动配置数据库.bat
    echo.
    echo 或者使用纯前端版本（无需数据库）：
    echo   npm run dev
    echo.
    pause
    exit /b 0
)

echo.
echo ========================================
echo   启动服务器...
echo ========================================
echo.
echo 前端: http://localhost:8080
echo 后端: http://localhost:3000
echo.
echo 按 Ctrl+C 停止服务器
echo.

call npm start

