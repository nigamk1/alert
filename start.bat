@echo off
echo.
echo ===============================================
echo    NIFTY ALERT SYSTEM - STARTUP SCRIPT
echo ===============================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

REM Check if npm packages are installed
if not exist "node_modules" (
    echo Installing npm packages...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install npm packages
        pause
        exit /b 1
    )
    echo.
)

REM Check if .env file exists
if not exist ".env" (
    echo ERROR: .env file not found
    echo Please create .env file with your configuration
    echo See README.md for details
    pause
    exit /b 1
)

echo Starting Nifty Alert System...
echo.
echo IMPORTANT: 
echo - Make sure your phone is ready to scan WhatsApp QR code
echo - The system will display a QR code for authentication
echo - Scan it with your WhatsApp to connect
echo.
echo Press Ctrl+C to stop the system
echo.

REM Start the application
node index.js

echo.
echo System has stopped.
pause
