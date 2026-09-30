@echo off
REM Start EyeRaksha Services - Windows Batch Script
REM This script starts all 3 services needed for EyeRaksha development

setlocal enabledelayedexpansion

REM Colors for output
echo.
echo ========================================
echo   EyeRaksha - Service Startup Script
echo ========================================
echo.

REM Check if Python is available
where /q python
if errorlevel 1 (
    where /q py
    if errorlevel 1 (
        if exist "C:\Users\Ramesh Rathod\AppData\Local\Programs\Python\Python313\python.exe" (
            set PYTHON_PATH="C:\Users\Ramesh Rathod\AppData\Local\Programs\Python\Python313\python.exe"
        ) else (
            echo ERROR: Python not found in PATH
            echo Setup Python first: Add Python to PATH
            pause
            exit /b 1
        )
    ) else (
        set PYTHON_PATH=py
    )
) else (
    set PYTHON_PATH=python
)

set PROJECT_DIR=C:\Users\Ramesh Rathod\Desktop\SIH project\EyeRaksha

REM Change to project directory
cd /d "%PROJECT_DIR%"

echo.
echo [1/3] Starting Mock Screening Adapter (Python on port 5000)...
start "EyeRaksha - Mock Adapter" cmd /k "%PYTHON_PATH% mock_adapter.py"

echo [2/3] Waiting 2 seconds for adapter to start...
timeout /t 2 /nobreak

echo [3/3] Starting Backend API Server (Node.js on port 8080)...
start "EyeRaksha - Backend" cmd /k "set MATLAB_SCREENING_ADAPTER_URL=http://127.0.0.1:5000/api/screen && cd backend && npm run server"

echo [4/4] Starting Frontend Dev Server (Vite on port 5173)...
start "EyeRaksha - Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo All services started!
echo ========================================
echo.
echo Frontend:     http://localhost:5173
echo Backend:      http://127.0.0.1:8080
echo Adapter:      http://127.0.0.1:5000
echo.
echo To stop services, close the terminal windows
echo.

pause
