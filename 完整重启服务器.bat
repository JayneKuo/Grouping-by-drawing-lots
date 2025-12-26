@echo off
chcp 65001 >nul
echo ========================================
echo   完整重启服务器（修复批量添加404）
echo ========================================
echo.

echo [1/3] 停止所有Node进程...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul
echo [√] 已停止

echo.
echo [2/3] 检查依赖...
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
echo [3/3] 启动服务器...
echo.
echo ✅ 已修复的问题：
echo    - 路由顺序调整（批量导入路由在单个添加之前）
echo    - 添加了详细的错误日志
echo    - 改进了错误处理
echo.
echo 📋 测试步骤：
echo    1. 访问 http://localhost:8080
echo    2. 登录后进入比赛详情
echo    3. 点击"参赛选手"右侧的"+"按钮
echo    4. 在批量添加文本框中输入多个姓名（每行一个）
echo    5. 点击"批量添加"按钮
echo.
echo 🌐 访问地址：
echo    前端: http://localhost:8080
echo    后端: http://localhost:3000
echo.
echo 按 Ctrl+C 停止服务器
echo.

call npm start

pause

