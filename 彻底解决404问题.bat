@echo off
chcp 65001 >nul
echo ========================================
echo   彻底解决404问题
echo ========================================
echo.

echo [步骤1/6] 停止所有Node进程...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 3 >nul
echo [√] 已停止

echo.
echo [步骤2/6] 清理端口...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 >nul
echo [√] 端口清理完成

echo.
echo [步骤3/6] 检查后端文件...
if not exist "backend\server-simple.js" (
    echo ❌ 错误：后端文件不存在！
    pause
    exit /b 1
)
findstr /C:"app.post('/api/tournaments/:id/players'" backend\server-simple.js >nul
if %errorlevel% neq 0 (
    echo ❌ 错误：路由定义不存在！
    pause
    exit /b 1
)
echo [√] 后端文件检查通过

echo.
echo [步骤4/6] 检查Vite配置...
if not exist "vite.config.js" (
    echo ❌ 错误：Vite配置文件不存在！
    pause
    exit /b 1
)
findstr /C:"target: 'http://localhost:3000'" vite.config.js >nul
if %errorlevel% neq 0 (
    echo ⚠️  警告：Vite代理配置可能不正确
)
echo [√] Vite配置检查完成

echo.
echo [步骤5/6] 安装依赖（如果需要）...
if not exist "node_modules" (
    echo [*] 安装前端依赖...
    call npm install --silent
)
if not exist "backend\node_modules" (
    echo [*] 安装后端依赖...
    cd backend
    call npm install --silent
    cd ..
)
echo [√] 依赖检查完成

echo.
echo [步骤6/6] 启动服务器...
echo.
echo ========================================
echo   重要提示
echo ========================================
echo.
echo 1. 后端服务器将在端口3000启动
echo 2. 前端服务器将在端口8080启动
echo 3. 请等待看到以下信息再测试：
echo    - "🚀 服务器运行在 http://localhost:3000"
echo    - "📋 已注册的路由："
echo.
echo 4. 如果前端运行在8081，请确保：
echo    - 后端在3000端口运行
echo    - Vite代理配置正确
echo.
echo 5. 测试步骤：
echo    a) 等待服务器完全启动
echo    b) 访问前端地址（http://localhost:8080或8081）
echo    c) 登录后进入比赛详情
echo    d) 点击"参赛选手"右侧的"+"按钮
echo    e) 尝试添加选手
echo    f) 查看后端控制台，应该看到"📥 [单个添加]"日志
echo.
echo 6. 如果还是404，请运行"测试后端连接.bat"检查后端
echo.
echo ========================================
echo.
echo 按 Ctrl+C 停止服务器
echo.

call npm start

pause

