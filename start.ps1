# start.ps1 - Master startup script for Enterprise Context Brain (ECB)
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  Starting Enterprise Context Brain (ECB) v2.1 Platform...       " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start Backend
Write-Host "[1/2] Launching FastAPI Backend on http://127.0.0.1:8001 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root/backend'; python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload"

Start-Sleep -Seconds 2

# Start Frontend
Write-Host "[2/2] Launching Next.js/Vite Frontend on http://localhost:3000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root/frontend'; npm run dev -- --port 3000 --host"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  ECB is now running!" -ForegroundColor Yellow
Write-Host "  Frontend Operating Console: http://localhost:3000" -ForegroundColor White
Write-Host "  FastAPI Swagger API Docs:   http://127.0.0.1:8001/docs" -ForegroundColor White
Write-Host "=================================================================" -ForegroundColor Cyan
