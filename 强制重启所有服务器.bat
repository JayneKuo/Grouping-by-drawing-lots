@echo off
chcp 65001 >nul
echo ========================================
echo   强制重启所有服务器（解决404问题）
echo ========================================
echo.

echo [1/4] 停止所有Node进程...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 3 >nul
echo [√] 已停止所有Node进程

echo.
echo [2/4] 清理端口...
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul
if %errorlevel% == 0 (
    echo [*] 端口3000仍被占用，强制清理...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
)
netstat -ano | findstr ":8080" | findstr "LISTENING" >nul
if %errorlevel% == 0 (
    echo [*] 端口8080仍被占用，强制清理...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080" ^| findstr "LISTENING"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
)
timeout /t 2 >nul
echo [√] 端口清理完成

echo.
echo [3/4] 检查依赖...
if not exist "node_modules" (
    echo [*] 安装前端依赖...
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
echo [4/4] 启动服务器...
echo.
echo ✅ 已修复的问题：
echo    - 路由顺序（批量导入在单个添加之前）
echo    - Vite代理配置（添加了secure和ws选项）
echo    - 详细的错误日志
echo.
echo 📋 重要提示：
echo    1. 后端服务器必须在端口3000运行
echo    2. 前端服务器会在端口8080运行（如果被占用会自动选择其他端口）
echo    3. 如果前端运行在8081，请确保后端在3000端口运行
echo.
echo 🌐 访问地址：
echo    前端: http://localhost:8080 （或8081）
echo    后端: http://localhost:3000
echo.
echo 📝 测试步骤：
echo    1. 等待服务器启动完成
echo    2. 访问前端地址
echo    3. 登录后进入比赛详情
echo    4. 点击"参赛选手"右侧的"+"按钮
echo    5. 在批量添加文本框中输入多个姓名（每行一个）
echo    6. 点击"批量添加"按钮
echo    7. 查看后端控制台日志（应该看到"📥 [批量导入] 收到请求"）
echo.
echo 按 Ctrl+C 停止服务器
echo.

call npm start

pause

