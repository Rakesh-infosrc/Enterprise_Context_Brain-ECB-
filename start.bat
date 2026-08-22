@echo off
echo =================================================================
echo   Starting Enterprise Context Brain (ECB) v2.1 Platform...
echo =================================================================

echo [1/2] Launching FastAPI Backend on http://127.0.0.1:8001 ...
start "ECB-Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload"

timeout /t 2 /nobreak >nul

echo [2/2] Launching Next.js/Vite Frontend on http://localhost:3000 ...
start "ECB-Frontend" cmd /k "cd /d %~dp0frontend && npm run dev -- --port 3000 --host"

echo =================================================================
echo   ECB is running!
echo   Frontend Operating Console: http://localhost:3000
echo   FastAPI Swagger API Docs:   http://127.0.0.1:8001/docs
echo =================================================================
pause
