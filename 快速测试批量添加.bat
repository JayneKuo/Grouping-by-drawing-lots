@echo off
chcp 65001 >nul
echo ========================================
echo   快速测试批量添加API
echo ========================================
echo.

echo [1/3] 检查后端服务器是否运行...
curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 后端服务器未运行！
    echo 请先启动后端服务器：cd backend ^&^& node server-simple.js
    pause
    exit /b 1
)
echo ✅ 后端服务器正在运行

echo.
echo [2/3] 检查批量导入路由...
curl -s -X POST http://localhost:3000/api/tournaments/999/players/batch -H "Content-Type: application/json" -d "{\"players\":[{\"name\":\"测试\"}]}" 2>&1 | findstr "比赛不存在" >nul
if %errorlevel% equ 0 (
    echo ✅ 批量导入路由存在（返回"比赛不存在"是正常的，说明路由已注册）
) else (
    echo ❌ 批量导入路由可能不存在或有问题
)

echo.
echo [3/3] 检查前端服务器...
curl -s http://localhost:8080 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 前端服务器在8080端口运行
) else (
    curl -s http://localhost:8081 >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ 前端服务器在8081端口运行
    ) else (
        echo ⚠️  前端服务器可能未运行
    )
)

echo.
echo ========================================
echo   测试完成
echo ========================================
echo.
echo 💡 如果后端路由存在但仍报404，可能的原因：
echo    1. Vite代理配置问题
echo    2. 前端请求路径错误
echo    3. 后端服务器未重启
echo.
pause

