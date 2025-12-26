@echo off
chcp 65001 >nul
echo ========================================
echo   球搭子网球赛事管理系统 - 启动服务器
echo ========================================
echo.

REM 检查Python是否安装
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo [√] 检测到Python，使用Python启动服务器...
    echo.
    echo 服务器地址: http://localhost:8000
    echo 按 Ctrl+C 停止服务器
    echo.
    python -m http.server 8000
    goto :end
)

REM 检查Node.js是否安装
node --version >nul 2>&1
if %errorlevel% == 0 (
    echo [√] 检测到Node.js，使用http-server启动...
    echo.
    echo 正在安装http-server（如果未安装）...
    call npm install -g http-server >nul 2>&1
    echo.
    echo 服务器地址: http://localhost:8080
    echo 按 Ctrl+C 停止服务器
    echo.
    http-server -p 8080
    goto :end
)

echo [×] 未检测到Python或Node.js
echo.
echo 请选择以下方式之一：
echo 1. 安装Python: https://www.python.org/downloads/
echo 2. 安装Node.js: https://nodejs.org/
echo 3. 使用VS Code的Live Server扩展
echo.
pause

:end

