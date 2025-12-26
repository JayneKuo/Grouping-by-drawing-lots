@echo off
chcp 65001 >nul
echo ========================================
echo   一键修复并重启（解决404问题）
echo ========================================
echo.

echo [1/5] 停止所有Node进程...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 3 >nul
echo [√] 已停止

echo.
echo [2/5] 清理端口...
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
echo [3/5] 检查依赖...
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
echo [4/5] 验证后端路由文件...
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
echo [√] 路由文件验证通过

echo.
echo [5/5] 启动服务器...
echo.
echo ✅ 已修复的问题：
echo    - 添加了详细的调试日志
echo    - 确保路由顺序正确
echo    - 改进了错误处理
echo.
echo 📋 重要提示：
echo    1. 后端服务器将在端口3000启动
echo    2. 前端服务器将在端口8080启动（如果被占用会自动选择其他端口）
echo    3. 请等待服务器完全启动后再测试
echo.
echo 🌐 访问地址：
echo    前端: http://localhost:8080
echo    后端: http://localhost:3000
echo.
echo 📝 测试步骤：
echo    1. 等待看到"服务器运行在 http://localhost:3000"
echo    2. 等待看到"已注册的路由"列表
echo    3. 访问前端地址并登录
echo    4. 进入比赛详情页
echo    5. 点击"参赛选手"右侧的"+"按钮
echo    6. 尝试添加单个选手或批量添加
echo    7. 查看后端控制台，应该看到"📥 [单个添加]"或"📥 [批量导入]"日志
echo.
echo ⚠️  如果还是404，请检查：
echo    1. 后端控制台是否显示"已注册的路由"
echo    2. 浏览器Network标签中的请求URL是否正确
echo    3. 后端控制台是否有任何错误信息
echo.
echo 按 Ctrl+C 停止服务器
echo.

call npm start

pause

