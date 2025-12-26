@echo off
chcp 65001 >nul
echo ========================================
echo   GitHub Gist 一键配置
echo ========================================
echo.

echo 📋 你的Gist信息：
echo    Gist ID: 2cabed01d5406fa3ea1334f2e116bc90
echo    Token: 需要输入
echo.

echo 请输入你的GitHub Personal Access Token：
echo （如果还没有，请访问：https://github.com/settings/tokens）
echo.
set /p GIST_TOKEN="Token: "

if "%GIST_TOKEN%"=="" (
    echo.
    echo ❌ Token不能为空！
    pause
    exit /b 1
)

echo.
echo [1/1] 正在创建配置文件...

(
echo VITE_GIST_ID=2cabed01d5406fa3ea1334f2e116bc90
echo VITE_GIST_TOKEN=%GIST_TOKEN%
) > .env.local

echo ✅ 已创建 .env.local 文件
echo.

echo ========================================
echo   ✅ 配置完成！
echo ========================================
echo.
echo 📋 下一步：
echo    1. 重启开发服务器（如果正在运行）
echo       - 按 Ctrl+C 停止当前服务器
echo       - 运行: npm run dev
echo       或双击: 启动开发.bat
echo.
echo    2. 刷新浏览器页面
echo.
echo    3. 测试功能：
echo       - 登录（admin / admin123）
echo       - 创建比赛
echo       - 查看控制台，应该看到同步成功
echo.
echo 💡 提示：
echo    - 数据会保存到GitHub Gist
echo    - 可以访问查看: https://gist.github.com/2cabed01d5406fa3ea1334f2e116bc90
echo    - 所有用户共享同一个Gist
echo.
pause

