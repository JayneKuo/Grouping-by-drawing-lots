Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 Firebase 部署" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "步骤1：登录Firebase..." -ForegroundColor Yellow
Write-Host "接下来会打开浏览器，请完成登录..." -ForegroundColor Yellow
Write-Host ""

firebase login

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ 登录失败，请重试" -ForegroundColor Red
    Read-Host "按Enter键退出"
    exit 1
}

Write-Host ""
Write-Host "✅ 登录成功！" -ForegroundColor Green
Write-Host ""
Write-Host "步骤2：构建项目..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ 构建失败" -ForegroundColor Red
    Read-Host "按Enter键退出"
    exit 1
}

Write-Host ""
Write-Host "✅ 构建成功！" -ForegroundColor Green
Write-Host ""
Write-Host "步骤3：部署到Firebase..." -ForegroundColor Yellow
Write-Host ""

firebase deploy --only hosting

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ 部署失败" -ForegroundColor Red
    Read-Host "按Enter键退出"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ 部署成功！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 你的应用已部署到：" -ForegroundColor Cyan
Write-Host ""
Write-Host "   🔗 https://tennis-tournament-f2e6e.web.app" -ForegroundColor Yellow
Write-Host "   🔗 https://tennis-tournament-f2e6e.firebaseapp.com" -ForegroundColor Yellow
Write-Host ""
Read-Host "按Enter键退出"

