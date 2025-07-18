# 🔧 Troubleshooting Guide

## Common Issues and Solutions

### 1. WhatsApp Client Not Ready Within Timeout

**Problem**: `⚠️ WhatsApp client not ready within timeout. Continuing anyway...`

**Solutions**:
- **Increase Timeout**: The timeout has been increased from 60 seconds to 3 minutes
- **Check QR Code**: Visit the web interface to scan the QR code
- **Restart WhatsApp**: If already authenticated, restart the application
- **Clear Session**: Delete the `.wwebjs_auth` folder and re-authenticate
- **Skip WhatsApp**: Set `SKIP_WHATSAPP=true` to test without WhatsApp

### 2. No Open Ports Detected (Render Deployment)

**Problem**: `==> No open ports detected, continuing to scan...`

**Solutions**:
- **Port Binding**: The web interface now binds to `0.0.0.0:PORT` in production
- **Environment Variable**: Ensure `PORT` is set by Render automatically
- **Health Check**: Use `/health` endpoint to verify the server is running
- **Check Logs**: Look for `🌐 Web interface started at...` message

### 3. System Improvements Made

**WhatsApp Client**:
- ✅ Increased timeout from 60s to 180s (3 minutes)
- ✅ Better progress logging (every 15 seconds instead of 2)
- ✅ Non-blocking initialization (WhatsApp starts in background)
- ✅ Better error handling and fallback options

**Web Interface**:
- ✅ Proper port binding for production (0.0.0.0:PORT)
- ✅ Automatic PORT environment variable detection
- ✅ Additional health check endpoints
- ✅ Better error handling

**General**:
- ✅ Enhanced startup script with better error handling
- ✅ Graceful shutdown handling
- ✅ Environment validation script
- ✅ Modular architecture for better maintainability

### 4. New Scripts Available

```bash
# Check environment configuration
node check-env.js

# Start with enhanced error handling
npm start

# Start directly (original method)
npm run start:direct

# Development mode with auto-restart
npm run dev

# Check system status
npm run status

# Run tests
npm test
```

### 5. Web Interface Endpoints

- **Main Interface**: `http://localhost:3000` (or your Render URL)
- **Health Check**: `/health` - System status
- **Ready Check**: `/ready` - Component readiness
- **QR Code API**: `/qr` - WhatsApp QR code
- **Status API**: `/status` - Detailed status
- **Ping**: `/ping` - Simple connectivity test

### 6. Environment Variables

**Required**:
- `RUN_INTERVAL_MINUTES`: How often to check for alerts
- `WHATSAPP_TARGET`: Target phone number for alerts

**Optional**:
- `SKIP_WHATSAPP=true`: Skip WhatsApp integration for testing
- `NODE_ENV=production`: Set for production deployment
- `PORT`: Web interface port (auto-set by Render)
- `WEB_PORT`: Alternative port setting
- `LOG_LEVEL`: Logging level (info, debug, error)

### 7. Production Deployment (Render)

**Environment Variables on Render**:
- Set `NODE_ENV=production`
- Set `RUN_INTERVAL_MINUTES=1`
- Set `WHATSAPP_TARGET=+1234567890`
- Set `SKIP_WHATSAPP=false` (or omit for WhatsApp integration)

**Health Check URL**: `/health`

### 8. Monitoring and Logs

**Log Files**:
- `logs/signals.log`: All system logs
- Console output: Real-time status updates

**Health Monitoring**:
- Heartbeat every 5 minutes
- Status updates every 30 minutes
- Graceful shutdown handling

### 9. Quick Start Steps

1. **Check Environment**:
   ```bash
   node check-env.js
   ```

2. **Start Application**:
   ```bash
   npm start
   ```

3. **For WhatsApp Authentication**:
   - Visit the web interface URL shown in console
   - Scan QR code with WhatsApp
   - Wait for "WhatsApp client is ready!" message

4. **For Production**:
   - Ensure all environment variables are set
   - Deploy to Render
   - Check health endpoint: `https://your-app.onrender.com/health`

### 10. Still Having Issues?

1. **Check Logs**: Look for specific error messages
2. **Environment**: Run `node check-env.js`
3. **Network**: Ensure ports are accessible
4. **Dependencies**: Run `npm install` to update packages
5. **Clean Start**: Delete `node_modules` and `package-lock.json`, then `npm install`

---

## System Status Messages

| Message | Meaning | Action |
|---------|---------|---------|
| 🚀 Starting... | System initialization | Wait for completion |
| 📱 Waiting for WhatsApp... | QR code authentication needed | Scan QR code |
| ✅ WhatsApp client is ready! | Authentication successful | System ready |
| ⚠️ WhatsApp client not ready | Timeout reached | Check QR code or restart |
| 🌐 Web interface started | Web server running | Can access web interface |
| 📊 Running cycle | System checking for alerts | Normal operation |
| ⏰ Market is closed | Skipping checks | Normal during off-hours |
| 🔄 System is running | All systems operational | Ready for alerts |
