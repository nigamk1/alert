# Render Deployment Configuration

## Environment Variables for Render

Set these environment variables in your Render dashboard:

### Required Variables
```
NODE_ENV=production
RUN_INTERVAL_MINUTES=1
WHATSAPP_TARGET=your_whatsapp_number
SKIP_WHATSAPP=true
```

### Optional Variables (for WhatsApp - not recommended for Render)
```
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

## Build Command
```
npm install
```

## Start Command
```
npm start
```

## Health Check URL
```
/health
```

## Why Skip WhatsApp on Render?

1. **Limited Resources**: Render's free tier has limited CPU and memory
2. **Chrome Dependencies**: Full Chrome installation requires additional system packages
3. **Protocol Errors**: Chrome DevTools Protocol often fails in containerized environments
4. **Better Alternatives**: Use webhooks, email, or external services for notifications

## Recommended Production Setup

### Option 1: Skip WhatsApp (Recommended)
```
SKIP_WHATSAPP=true
```
- System runs without WhatsApp integration
- All alerts are logged and accessible via web interface
- Better reliability and performance

### Option 2: External Notification Service
- Use services like Twilio, SendGrid, or Discord webhooks
- More reliable than WhatsApp Web automation
- Better for production environments

### Option 3: Separate WhatsApp Server
- Run WhatsApp client on a separate server with full Chrome support
- Use webhooks to send notifications from main app to WhatsApp server
- More complex but separates concerns

## Monitoring and Alerts

Even without WhatsApp, you can monitor alerts through:
- Web interface: `https://your-app.onrender.com`
- Health check: `https://your-app.onrender.com/health`
- Status API: `https://your-app.onrender.com/status`
- Log files: Check Render logs for alert notifications

## Troubleshooting

If you still want to try WhatsApp on Render:

1. **Install Chrome dependencies**:
   ```bash
   # Add to package.json scripts
   "heroku-postbuild": "apt-get update && apt-get install -y google-chrome-stable"
   ```

2. **Use Buildpack**:
   - Add Chrome buildpack to your Render service
   - This is complex and not guaranteed to work

3. **Check logs**:
   - Look for specific error messages
   - Chrome processes may be killed by Render due to memory limits
