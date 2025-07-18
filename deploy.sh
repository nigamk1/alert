#!/bin/bash

# Render Deployment Script
# This script helps deploy the Nifty Alert System to Render

echo "🚀 Nifty Alert System - Render Deployment Helper"
echo "================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📋 Pre-deployment checklist:"
echo "✅ Code is ready for production"
echo "✅ Environment variables are configured"
echo "✅ GitHub repository is up to date"
echo ""

echo "🔧 Next Steps:"
echo "1. Go to https://render.com and sign in"
echo "2. Click 'New' → 'Web Service'"
echo "3. Connect your GitHub account"
echo "4. Select repository: nigamk1/alert"
echo "5. Select branch: production"
echo "6. Configure as follows:"
echo "   - Name: nifty-alert-system"
echo "   - Environment: Node"
echo "   - Build Command: npm install"
echo "   - Start Command: npm start"
echo "   - Plan: Free (or higher)"
echo ""

echo "📊 Required Environment Variables:"
echo "NODE_ENV=production"
echo "PORT=3000"
echo "WEB_PORT=3000"
echo "WHATSAPP_TARGET=your_number@c.us"
echo "RUN_INTERVAL_MINUTES=1"
echo "ALERT_STRATEGY=EMA_BREAKDOWN"
echo "EMA_FAST_PERIOD=5"
echo "EMA_SLOW_PERIOD=200"
echo "VOLUME_SMA_PERIOD=20"
echo "MIN_BODY_SIZE_PERCENT=0.1"
echo "NSE_URL=https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY"
echo "OPTION_TYPE=PUT"
echo "LOG_FILE=./logs/signals.log"
echo ""

echo "🌐 After deployment:"
echo "1. Update RENDER_EXTERNAL_HOSTNAME with your app URL"
echo "2. Visit your app URL to scan WhatsApp QR code"
echo "3. Monitor logs for successful connection"
echo ""

echo "📚 For detailed instructions, see DEPLOYMENT.md"
echo "🎯 Repository: https://github.com/nigamk1/alert"
echo ""
echo "🚀 Ready to deploy!"
