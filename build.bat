@echo off
echo 🚀 Starting build process...

REM Install dependencies
echo 📦 Installing dependencies...
npm install --omit=dev

REM Create logs directory
echo 📁 Creating logs directory...
if not exist "logs" mkdir logs

REM Set up environment for production
echo 🔧 Setting up production environment...
set NODE_ENV=production

echo ✅ Build completed successfully!
echo 🎯 Ready to start Nifty Alert System...
