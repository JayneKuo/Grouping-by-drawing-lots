@echo off
chcp 65001 >nul
echo ========================================
echo   GitHub Gist配置
echo ========================================
echo.

echo [1/1] 创建配置文件...
(
echo VITE_GIST_ID=YOUR_GIST_ID
echo VITE_GIST_TOKEN=YOUR_GIST_TOKEN
) > .env.local

echo ✅ 已创建 .env.local 文件
echo.
echo 📝 配置内容：
type .env.local
echo.

echo ========================================
echo   ✅ 配置完成！
echo ========================================
echo.
echo 📋 下一步：
echo    1. 重启开发服务器（如果正在运行）
echo       - 按 Ctrl+C 停止当前服务器
echo       - 运行: npm run dev
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
