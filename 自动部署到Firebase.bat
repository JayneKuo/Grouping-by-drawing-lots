@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 Firebase Hosting 自动部署
echo ========================================
echo.

echo [1/4] 检查Firebase CLI...
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
    for /f "tokens=*" %%i in ('firebase --version') do set FIREBASE_VERSION=%%i
    echo ✅ Firebase CLI已安装 (版本: %FIREBASE_VERSION%)
)
echo.

echo [2/4] 检查Firebase登录状态...
firebase projects:list >nul 2>&1
if errorlevel 1 (
    echo ⚠️  未登录Firebase，需要先登录...
    echo.
    echo 📝 请按照以下步骤操作：
    echo    1. 接下来会打开浏览器
    echo    2. 选择你的Google账号登录
    echo    3. 授权Firebase CLI访问
    echo    4. 登录成功后，按任意键继续...
    echo.
    pause
    echo.
    echo 🔐 正在打开浏览器登录...
    firebase login
    if errorlevel 1 (
        echo ❌ 登录失败，请重试
        pause
        exit /b 1
    )
    echo ✅ 登录成功
) else (
    echo ✅ 已登录Firebase
)
echo.

echo [3/4] 构建项目...
call npm run build
if errorlevel 1 (
    echo ❌ 构建失败
    pause
    exit /b 1
)
echo ✅ 构建成功
echo.

echo [4/4] 部署到Firebase Hosting...
echo.
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
echo 🌐 你的应用已部署到：
echo.
echo    🔗 https://tennis-tournament-f2e6e.web.app
echo    🔗 https://tennis-tournament-f2e6e.firebaseapp.com
echo.
echo 💡 提示：
echo    - 所有用户都可以访问这些地址
echo    - 数据会自动同步到Firebase
echo    - 更新代码后，运行此脚本即可重新部署
echo.
pause

