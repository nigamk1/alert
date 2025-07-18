#!/bin/bash

# Render Build Script
echo "🚀 Starting Render build process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install --omit=dev

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs

# Set up Chrome/Chromium for Puppeteer
echo "🌐 Setting up Chrome for WhatsApp Web..."
if [ -f /usr/bin/google-chrome-stable ]; then
    export PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
    echo "✅ Using system Chrome"
elif [ -f /usr/bin/chromium-browser ]; then
    export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
    echo "✅ Using system Chromium"
else
    echo "⚠️  No system browser found, using bundled Chromium"
fi

echo "✅ Build completed successfully!"
echo "🎯 Starting Nifty Alert System..."
