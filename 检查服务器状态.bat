@echo off
chcp 65001 >nul
echo ========================================
echo   检查服务器状态
echo ========================================
echo.

echo [检查端口占用情况]
echo.
netstat -ano | findstr ":3000 :8080 :8081"
echo.

echo [检查Node进程]
echo.
tasklist | findstr "node.exe"
echo.

echo [检查后端路由]
echo.
echo 请检查 backend/server-simple.js 中是否有以下路由：
echo   - POST /api/tournaments/:id/players/batch
echo   - POST /api/tournaments/:id/players
echo.

pause

