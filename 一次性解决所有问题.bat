@echo off
chcp 65001 >nul
title 一次性解决所有问题
echo ========================================
echo   一次性解决所有问题
echo ========================================
echo.

echo [1/7] 停止所有Node进程...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 3 >nul
echo [√] 已停止所有Node进程

echo.
echo [2/7] 清理所有端口占用...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8081" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 >nul
echo [√] 端口清理完成

echo.
echo [3/7] 验证关键文件...
if not exist "backend\server-simple.js" (
    echo ❌ 错误：后端文件不存在！
    pause
    exit /b 1
)
if not exist "vite.config.js" (
    echo ❌ 错误：Vite配置文件不存在！
    pause
    exit /b 1
)
if not exist "src\api\players.js" (
    echo ❌ 错误：前端API文件不存在！
    pause
    exit /b 1
)
echo [√] 文件验证通过

echo.
echo [4/7] 验证后端路由...
findstr /C:"app.post('/api/tournaments/:id/players/batch'" backend\server-simple.js >nul
if %errorlevel% neq 0 (
    echo ❌ 错误：批量导入路由不存在！
    pause
    exit /b 1
)
findstr /C:"app.post('/api/tournaments/:id/players'" backend\server-simple.js >nul
if %errorlevel% neq 0 (
    echo ❌ 错误：单个添加路由不存在！
    pause
    exit /b 1
)
echo [√] 后端路由验证通过

echo.
echo [5/7] 验证Vite代理配置...
findstr /C:"target: 'http://localhost:3000'" vite.config.js >nul
if %errorlevel% neq 0 (
    echo ❌ 错误：Vite代理配置不正确！
    pause
    exit /b 1
)
echo [√] Vite代理配置验证通过

echo.
echo [6/7] 安装依赖（如果需要）...
if not exist "node_modules" (
    echo [*] 安装前端依赖...
    call npm install --silent
    if %errorlevel% neq 0 (
        echo ❌ 前端依赖安装失败！
        pause
        exit /b 1
    )
)
if not exist "backend\node_modules" (
    echo [*] 安装后端依赖...
    cd backend
    call npm install --silent
    if %errorlevel% neq 0 (
        echo ❌ 后端依赖安装失败！
        cd ..
        pause
        exit /b 1
    )
    cd ..
)
echo [√] 依赖检查完成

echo.
echo [7/7] 启动服务器...
echo.
echo ========================================
echo   服务器启动中...
echo ========================================
echo.
echo ✅ 所有检查通过，正在启动服务器...
echo.
echo 📋 重要提示：
echo    1. 请等待看到以下信息再测试：
echo       - "🚀 服务器运行在 http://localhost:3000"
echo       - "📋 已注册的路由："
echo       - "VITE v5.x.x  ready in xxx ms"
echo.
echo    2. 如果看到这些信息，说明服务器启动成功
echo.
echo    3. 测试步骤：
echo       a) 访问 http://localhost:8080 （或8081）
echo       b) 登录（admin / admin123）
echo       c) 进入比赛详情页
echo       d) 点击"参赛选手"右侧的"+"按钮
echo       e) 尝试添加选手
echo       f) 查看后端控制台，应该看到"📥 [单个添加]"日志
echo.
echo    4. 如果还是404，请检查：
echo       - 后端控制台是否显示"已注册的路由"
echo       - 浏览器Network标签中的请求URL
echo       - 后端控制台是否有错误信息
echo.
echo ========================================
echo.
echo 按 Ctrl+C 停止服务器
echo.

call npm start

pause

