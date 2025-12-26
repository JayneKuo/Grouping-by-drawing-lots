@echo off
chcp 65001 >nul
echo 正在登录Firebase，请稍候...
firebase login
echo.
echo 正在构建项目...
call npm run build
echo.
echo 正在部署...
firebase deploy --only hosting
echo.
echo 完成！按任意键退出...
pause >nul

