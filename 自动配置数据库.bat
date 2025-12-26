@echo off
chcp 65001 >nul
echo ========================================
echo   数据库自动配置工具
echo ========================================
echo.

echo [1/4] 检查MySQL...
mysql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [×] 未检测到MySQL
    echo.
    echo 请选择：
    echo 1. 安装MySQL: https://dev.mysql.com/downloads/mysql/
    echo 2. 使用简化版本（无需MySQL，仅前端）
    echo.
    pause
    exit /b 1
)
echo [√] MySQL已安装

echo.
echo [2/4] 检查后端依赖...
cd backend
if not exist "node_modules" (
    echo [*] 正在安装后端依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo [×] 依赖安装失败
        pause
        exit /b 1
    )
)
echo [√] 后端依赖已安装
cd ..

echo.
echo [3/4] 配置数据库连接...
echo.
echo 请输入MySQL root密码（如果没有密码，直接按Enter）：
set /p DB_PASSWORD="密码: "

if "%DB_PASSWORD%"=="" (
    echo DB_PASSWORD= > backend\.env.tmp
) else (
    echo DB_PASSWORD=%DB_PASSWORD% > backend\.env.tmp
)

type backend\.env.example | findstr /V "DB_PASSWORD" >> backend\.env.tmp
move /Y backend\.env.tmp backend\.env >nul
echo [√] 数据库配置已保存

echo.
echo [4/4] 初始化数据库...
cd backend
call npm run init-db
if %errorlevel% neq 0 (
    echo.
    echo [×] 数据库初始化失败
    echo.
    echo 可能的原因：
    echo 1. MySQL服务未启动
    echo 2. 密码错误
    echo 3. 数据库权限不足
    echo.
    echo 解决方法：
    echo 1. 启动MySQL服务: net start mysql
    echo 2. 检查密码是否正确
    echo 3. 手动编辑 backend\.env 文件
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo   ✅ 数据库配置完成！
echo ========================================
echo.
echo 默认管理员账号：admin / admin123
echo.
pause

