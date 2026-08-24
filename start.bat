@echo off
echo =================================================================
echo   Starting Enterprise Context Brain (ECB) v2.2 Platform...
echo =================================================================

echo [1/2] Activating Backend Virtual Environment ^& Launching FastAPI (Port 8001)...
start "ECB-Backend" cmd /k "cd /d %~dp0backend && if exist venv\Scripts\activate.bat (call venv\Scripts\activate.bat) && python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload"

timeout /t 2 /nobreak >nul

echo [2/2] Launching Vite React Glassmorphic Console on http://localhost:3000 ...
start "ECB-Frontend" cmd /k "cd /d %~dp0frontend && npm run dev -- --port 3000 --host"

echo =================================================================
echo   ECB v2.2 Platform is running!
echo   ---------------------------------------------------------------
echo   Frontend Console:           http://localhost:3000
echo   FastAPI Swagger API Docs:   http://127.0.0.1:8001/docs
echo   ---------------------------------------------------------------
echo   Testing Credentials:
echo   User:  sarah.jenkins@acmefin.com
echo   Pass:  password123
echo =================================================================
pause
