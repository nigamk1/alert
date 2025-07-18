#!/bin/bash

# Render Deployment Script
# This script sets up the environment for production deployment

echo "🚀 Setting up Nifty Alert System for Production..."

# Set production environment
export NODE_ENV=production

# Skip WhatsApp for production stability
export SKIP_WHATSAPP=true

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs

# Check if required environment variables are set
echo "🔍 Checking environment variables..."

if [ -z "$RUN_INTERVAL_MINUTES" ]; then
    echo "⚠️  RUN_INTERVAL_MINUTES not set, using default: 1"
    export RUN_INTERVAL_MINUTES=1
fi

if [ -z "$WHATSAPP_TARGET" ]; then
    echo "⚠️  WHATSAPP_TARGET not set"
    echo "💡 Set this in your Render dashboard if you plan to enable WhatsApp later"
fi

echo "✅ Production setup complete!"
echo "🌐 Starting application..."

# Start the application
npm start
