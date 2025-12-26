@echo off
chcp 65001 >nul
echo ========================================
echo   测试后端连接
echo ========================================
echo.

echo [测试1] 检查后端健康状态...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/health' -UseBasicParsing -TimeoutSec 5; Write-Host '✅ 后端服务器运行正常'; Write-Host $response.Content } catch { Write-Host '❌ 后端服务器未运行或无法连接'; Write-Host $_.Exception.Message }"
echo.

echo [测试2] 测试单个添加路由...
powershell -Command "try { $body = @{name='测试选手';status='pending'} | ConvertTo-Json; $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/tournaments/999/players' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing -TimeoutSec 5; Write-Host '✅ 路由存在（返回比赛不存在是正常的）'; Write-Host $response.Content } catch { if ($_.Exception.Response.StatusCode -eq 404) { Write-Host '❌ 路由不存在（404）' } else { Write-Host '⚠️  其他错误:' $_.Exception.Message } }"
echo.

echo [测试3] 测试批量导入路由...
powershell -Command "try { $body = @{players=@(@{name='测试选手';status='pending'})} | ConvertTo-Json -Depth 10; $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/tournaments/999/players/batch' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing -TimeoutSec 5; Write-Host '✅ 路由存在（返回比赛不存在是正常的）'; Write-Host $response.Content } catch { if ($_.Exception.Response.StatusCode -eq 404) { Write-Host '❌ 路由不存在（404）' } else { Write-Host '⚠️  其他错误:' $_.Exception.Message } }"
echo.

echo ========================================
echo   测试完成
echo ========================================
echo.
echo 💡 如果测试1失败，说明后端服务器未运行
echo 💡 如果测试2或3返回404，说明路由未注册
echo.
pause

