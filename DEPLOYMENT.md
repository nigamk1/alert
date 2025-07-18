# 🚀 Production Deployment Guide for Render

## 📋 Prerequisites
- GitHub repository with the code
- Render account (free tier available)
- WhatsApp phone number for authentication

## 🔧 Step-by-Step Deployment

### 1. Create Production Branch
```bash
# Create and switch to production branch
git checkout -b production

# Add production files
git add .
git commit -m "Add production configuration for Render deployment"
git push origin production
```

### 2. Render Deployment Steps

#### Option A: Using Render Dashboard
1. **Login to Render**: Go to https://render.com and sign in
2. **New Web Service**: Click "New" → "Web Service"
3. **Connect Repository**: 
   - Select "Build and deploy from Git repository"
   - Connect your GitHub account
   - Choose repository: `nigamk1/alert`
   - Select branch: `production`

4. **Configure Service**:
   - **Name**: `nifty-alert-system`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free` (or higher for production)

5. **Environment Variables**:
   Add these in Render dashboard:
   ```
   NODE_ENV=production
   PORT=3000
   WEB_PORT=3000
   WHATSAPP_TARGET=your_number@c.us
   RUN_INTERVAL_MINUTES=1
   ALERT_STRATEGY=EMA_BREAKDOWN
   EMA_FAST_PERIOD=5
   EMA_SLOW_PERIOD=200
   VOLUME_SMA_PERIOD=20
   MIN_BODY_SIZE_PERCENT=0.1
   NSE_URL=https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY
   OPTION_TYPE=PUT
   LOG_FILE=./logs/signals.log
   ```

#### Option B: Using render.yaml (Automatic)
1. The `render.yaml` file is already configured
2. Render will automatically detect and use it
3. Just connect the repository and deploy

### 3. Post-Deployment Setup

#### Update Environment Variables
Once deployed, update `RENDER_EXTERNAL_HOSTNAME`:
```
RENDER_EXTERNAL_HOSTNAME=your-app-name.onrender.com
```

#### Access Your Application
- **Web Interface**: `https://your-app-name.onrender.com`
- **Health Check**: `https://your-app-name.onrender.com/health`
- **Status**: `https://your-app-name.onrender.com/status`

### 4. WhatsApp Authentication
1. Open your deployed app URL
2. Scan the QR code with your WhatsApp
3. System will start monitoring automatically

## 🔧 Production Configuration

### Environment Variables (Required)
```env
NODE_ENV=production
PORT=3000
WHATSAPP_TARGET=your_number@c.us
RENDER_EXTERNAL_HOSTNAME=your-app-name.onrender.com
```

### Optional Configuration
```env
RUN_INTERVAL_MINUTES=1
EMA_FAST_PERIOD=5
EMA_SLOW_PERIOD=200
VOLUME_SMA_PERIOD=20
MIN_BODY_SIZE_PERCENT=0.1
```

## 📊 Monitoring & Maintenance

### Health Checks
- **Endpoint**: `/health`
- **Status**: `/status`
- **Response**: JSON with system status

### Logs
- Check Render dashboard for application logs
- Monitor WhatsApp connection status
- Track alert frequency and accuracy

### Scaling
- **Free Tier**: 750 hours/month
- **Paid Tier**: Always-on service
- **Auto-scaling**: Available on paid plans

## 🚨 Production Considerations

### Security
- ✅ Environment variables for sensitive data
- ✅ HTTPS by default on Render
- ✅ Local WhatsApp authentication
- ✅ No API keys exposed

### Performance
- ✅ Optimized for minimal resource usage
- ✅ Efficient data fetching with rate limiting
- ✅ Alert cooldown to prevent spam
- ✅ Market hours detection

### Reliability
- ✅ Health checks for uptime monitoring
- ✅ Graceful error handling
- ✅ Automatic restarts on failure
- ✅ Persistent logs and state

## 🔄 Continuous Deployment

### Auto-Deploy Setup
1. Enable auto-deploy in Render dashboard
2. Select `production` branch
3. Every push to production will trigger deployment

### Development Workflow
```bash
# Development
git checkout main
# Make changes
git add .
git commit -m "Feature: description"
git push origin main

# Production deployment
git checkout production
git merge main
git push origin production  # This triggers deployment
```

## 📞 Support & Troubleshooting

### Common Issues
1. **WhatsApp Authentication**: Check QR code accessibility
2. **Environment Variables**: Verify all required vars are set
3. **Market Data**: NSE API may have rate limits
4. **Memory Usage**: Monitor Render dashboard for limits

### Render Support
- **Free Tier**: Community support
- **Paid Tier**: Email support
- **Documentation**: https://render.com/docs

## 🎯 Next Steps

1. Deploy to production
2. Set up environment variables
3. Test WhatsApp authentication
4. Monitor for 24 hours
5. Verify alerts during market hours
6. Scale up if needed

---

**🚀 Your Nifty Alert System is now production-ready on Render!**
