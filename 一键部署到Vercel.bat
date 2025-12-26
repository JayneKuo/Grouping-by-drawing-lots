@echo off
chcp 65001 >nul
echo ========================================
echo   一键部署到Vercel（免费，国内访问快）
echo ========================================
echo.

echo [1/4] 检查Vercel CLI...
where vercel >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Vercel CLI未安装
    echo 正在安装Vercel CLI...
    call npm install -g vercel
    if %errorlevel% neq 0 (
        echo ❌ 安装失败，请手动运行: npm install -g vercel
        pause
        exit /b 1
    )
)
echo ✅ Vercel CLI已安装

echo.
echo [2/4] 检查依赖...
if not exist "node_modules\@vercel\kv" (
    echo 正在安装 @vercel/kv...
    call npm install @vercel/kv
)

echo.
echo [3/4] 构建项目...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ 构建失败
    pause
    exit /b 1
)
echo ✅ 构建成功

echo.
echo [4/4] 部署到Vercel...
echo 提示：如果是第一次部署，需要登录Vercel账号
echo.
call vercel --prod

echo.
echo ========================================
echo   部署完成！
echo ========================================
echo.
echo 下一步：
echo 1. 在Vercel Dashboard创建KV数据库
echo 2. 配置环境变量（KV_REST_API_URL等）
echo 3. 修改 src/utils/storage.js 设置 USE_VERCEL_API = true
echo 4. 重新部署
echo.
pause

