# start.ps1 - Master startup script for Enterprise Context Brain (ECB) v2.2
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  Starting Enterprise Context Brain (ECB) v2.2 Platform...       " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start Backend
Write-Host "[1/2] Activating Backend Virtual Environment & Launching FastAPI (Port 8001)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root/backend'; if (Test-Path 'venv/Scripts/Activate.ps1') { . 'venv/Scripts/Activate.ps1' }; python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload"

Start-Sleep -Seconds 2

# Start Frontend
Write-Host "[2/2] Launching Vite React Glassmorphic Console on http://localhost:3000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root/frontend'; npm run dev -- --port 3000 --host"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  ECB v2.2 Platform is now running!" -ForegroundColor Yellow
Write-Host "  ---------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  Frontend Console:           http://localhost:3000" -ForegroundColor White
Write-Host "  FastAPI Swagger API Docs:   http://127.0.0.1:8001/docs" -ForegroundColor White
Write-Host "  ---------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  Testing Credentials:" -ForegroundColor Green
Write-Host "  User:  sarah.jenkins@acmefin.com" -ForegroundColor Yellow
Write-Host "  Pass:  password123" -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan
