# 球搭子网球赛事管理系统 - PowerShell启动脚本
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  球搭子网球赛事管理系统 - 启动服务器" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查Python
try {
    $pythonVersion = python --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[√] 检测到Python: $pythonVersion" -ForegroundColor Green
        Write-Host ""
        Write-Host "服务器地址: http://localhost:8000" -ForegroundColor Yellow
        Write-Host "按 Ctrl+C 停止服务器" -ForegroundColor Yellow
        Write-Host ""
        python -m http.server 8000
        exit
    }
} catch {
    Write-Host "[×] Python未安装或不在PATH中" -ForegroundColor Red
}

# 检查Node.js
try {
    $nodeVersion = node --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[√] 检测到Node.js: $nodeVersion" -ForegroundColor Green
        Write-Host ""
        Write-Host "正在检查http-server..." -ForegroundColor Yellow
        $httpServer = Get-Command http-server -ErrorAction SilentlyContinue
        if (-not $httpServer) {
            Write-Host "正在安装http-server..." -ForegroundColor Yellow
            npm install -g http-server
        }
        Write-Host ""
        Write-Host "服务器地址: http://localhost:8080" -ForegroundColor Yellow
        Write-Host "按 Ctrl+C 停止服务器" -ForegroundColor Yellow
        Write-Host ""
        http-server -p 8080
        exit
    }
} catch {
    Write-Host "[×] Node.js未安装或不在PATH中" -ForegroundColor Red
}

Write-Host ""
Write-Host "[×] 未检测到Python或Node.js" -ForegroundColor Red
Write-Host ""
Write-Host "请选择以下方式之一：" -ForegroundColor Yellow
Write-Host "1. 安装Python: https://www.python.org/downloads/" -ForegroundColor White
Write-Host "2. 安装Node.js: https://nodejs.org/" -ForegroundColor White
Write-Host "3. 使用VS Code的Live Server扩展" -ForegroundColor White
Write-Host ""
Read-Host "按Enter键退出"

