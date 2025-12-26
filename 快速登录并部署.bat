@echo off
chcp 65001 >nul
echo ========================================
echo 🔐 Firebase 登录并部署
echo ========================================
echo.

echo 📝 步骤1：登录Firebase
echo    接下来会打开浏览器，请完成登录...
echo.
pause

firebase login
if errorlevel 1 (
    echo.
    echo ❌ 登录失败，请重试
    pause
    exit /b 1
)

echo.
echo ✅ 登录成功！
echo.
echo 📝 步骤2：构建项目...
call npm run build
if errorlevel 1 (
    echo ❌ 构建失败
    pause
    exit /b 1
)
echo ✅ 构建成功
echo.

echo 📝 步骤3：部署到Firebase Hosting...
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
pause

