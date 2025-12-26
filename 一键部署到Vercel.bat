@echo off
chcp 65001 >nul
echo ========================================
echo   一键部署到Vercel
echo ========================================
echo.

echo [1/3] 检查Vercel CLI...
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
echo [2/3] 构建项目...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ 构建失败
    pause
    exit /b 1
)
echo ✅ 构建成功

echo.
echo [3/3] 部署到Vercel...
echo 提示：如果是第一次部署，需要登录Vercel账号
echo.
call vercel --prod

echo.
echo ========================================
echo   部署完成！
echo ========================================
echo.
echo 访问你的Vercel域名即可使用
echo.
pause
