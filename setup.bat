@echo off
echo.
echo ===============================================
echo    NIFTY ALERT SYSTEM - SETUP SCRIPT
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

echo Installing required packages...
echo This may take a few minutes...
echo.

REM Install packages
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install npm packages
    pause
    exit /b 1
)

echo.
echo ===============================================
echo    INSTALLATION COMPLETE!
echo ===============================================
echo.
echo Next steps:
echo 1. Review and edit .env file with your settings
echo 2. Run start.bat to start the system
echo 3. Scan WhatsApp QR code when prompted
echo.
echo See README.md for detailed instructions
echo.
pause
