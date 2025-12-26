@echo off
chcp 65001 >nul
echo ========================================
echo Firebase Hosting 一键部署
echo ========================================
echo.

echo [1/3] 检查Firebase CLI...
firebase --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Firebase CLI未安装，正在安装...
    call npm install -g firebase-tools
    if errorlevel 1 (
        echo ❌ 安装失败，请手动运行: npm install -g firebase-tools
        pause
        exit /b 1
    )
    echo ✅ Firebase CLI安装成功
) else (
    echo ✅ Firebase CLI已安装
)
echo.

echo [2/3] 构建项目...
call npm run build
if errorlevel 1 (
    echo ❌ 构建失败
    pause
    exit /b 1
)
echo ✅ 构建成功
echo.

echo [3/3] 检查Firebase登录状态...
firebase projects:list >nul 2>&1
if errorlevel 1 (
    echo ⚠️  未登录Firebase，请先登录...
    echo 正在打开浏览器登录...
    firebase login
    if errorlevel 1 (
        echo ❌ 登录失败
        pause
        exit /b 1
    )
) else (
    echo ✅ 已登录Firebase
)
echo.

echo [4/4] 部署到Firebase Hosting...
firebase deploy --only hosting
if errorlevel 1 (
    echo ❌ 部署失败
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ 部署成功！
echo ========================================
echo.
echo 🌐 访问地址：
echo    https://tennis-tournament-f2e6e.web.app
echo    https://tennis-tournament-f2e6e.firebaseapp.com
echo.
pause

