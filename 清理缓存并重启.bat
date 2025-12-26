@echo off
chcp 65001 >nul
echo 正在清理缓存并重启开发服务器...

REM 停止所有Node进程
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

REM 清理Vite缓存
if exist "node_modules\.vite" (
    echo 清理Vite缓存...
    rmdir /s /q "node_modules\.vite" 2>nul
)

REM 清理dist目录
if exist "dist" (
    echo 清理dist目录...
    rmdir /s /q "dist" 2>nul
)

echo.
echo 正在启动开发服务器...
start cmd /k "npm run dev"

timeout /t 3 /nobreak >nul
echo.
echo ✅ 开发服务器已启动！
echo 请在浏览器中访问 http://localhost:8080
echo.
pause

