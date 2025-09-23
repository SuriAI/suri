@echo off
setlocal enabledelayedexpansion

echo ========================================
echo    Suri - Development Mode
echo ========================================
echo.

:: Check if we're in the correct directory
if not exist "backend" (
    echo Error: backend directory not found. Please run this script from the project root.
    pause
    exit /b 1
)

if not exist "desktop" (
    echo Error: desktop directory not found. Please run this script from the project root.
    pause
    exit /b 1
)

echo Starting development servers...
echo.

:: Start backend in a new window
echo Starting Python backend...
start "Suri Backend" cmd /k "cd backend && python run.py"

:: Wait a moment for backend to start
timeout /t 3 /nobreak > nul

:: Start frontend
echo Starting Electron frontend...
cd desktop
call pnpm dev

echo.
echo Development servers stopped.
pause