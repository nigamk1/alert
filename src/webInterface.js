const express = require('express');
const qrcode = require('qrcode');
const { logToFile } = require('./utils');
const { findAvailablePort } = require('./portUtils');

/**
 * Web interface for displaying WhatsApp QR codes
 */
class WebInterface {
    constructor() {
        this.app = express();
        this.server = null;
        
        // Parse port as integer and ensure it's within valid range
        const envPort = process.env.PORT || process.env.WEB_PORT || '3000';
        let port = parseInt(envPort);
        
        // Validate port range
        if (isNaN(port) || port < 1 || port > 65535) {
            console.log(`⚠️ Invalid port ${port}, using default 3000`);
            port = 3000;
        }
        
        this.port = port;
        this.currentQR = null;
        this.isAuthenticated = false;
        this.setupRoutes();
    }

    /**
     * Setup Express routes
     */
    setupRoutes() {
        // Static HTML for QR display
        this.app.get('/', (req, res) => {
            res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nifty Alert System - WhatsApp QR Code</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 500px;
            width: 100%;
        }
        h1 {
            color: #333;
            margin-bottom: 20px;
            font-size: 24px;
        }
        .qr-container {
            margin: 20px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
            border: 2px dashed #007bff;
        }
        .qr-code {
            max-width: 100%;
            height: auto;
        }
        .status {
            margin: 20px 0;
            padding: 15px;
            border-radius: 8px;
            font-weight: bold;
        }
        .status.waiting {
            background: #fff3cd;
            color: #856404;
            border: 1px solid #ffeaa7;
        }
        .status.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .status.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .instructions {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: left;
        }
        .instructions h3 {
            margin-top: 0;
            color: #1976d2;
        }
        .instructions ol {
            margin: 10px 0;
            padding-left: 20px;
        }
        .refresh-btn {
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px;
        }
        .refresh-btn:hover {
            background: #0056b3;
        }
        .footer {
            margin-top: 20px;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📱 Nifty Alert System</h1>
        <h2 id="main-title">WhatsApp QR Code Authentication</h2>
        
        <div id="status" class="status waiting">
            🔄 Checking system status...
        </div>
        
        <div class="qr-container">
            <div id="qr-code">
                <p>Loading QR code...</p>
            </div>
        </div>
        
        <div class="instructions">
            <h3>📋 Instructions:</h3>
            <ol>
                <li>Open WhatsApp on your phone</li>
                <li>Tap the three dots (⋮) in the top right corner</li>
                <li>Select "Linked devices"</li>
                <li>Tap "Link a device"</li>
                <li>Point your phone's camera at the QR code above</li>
                <li>Wait for authentication to complete</li>
            </ol>
        </div>
        
        <button class="refresh-btn" onclick="refreshQR()">🔄 Refresh QR Code</button>
        
        <div class="footer">
            <p>🤖 Nifty Alert System - EMA Breakdown Strategy</p>
            <p>Auto-refresh every 30 seconds</p>
        </div>
    </div>

    <script>
        let refreshInterval;
        
        function refreshQR() {
            fetch('/qr')
                .then(response => response.json())
                .then(data => {
                    const statusDiv = document.getElementById('status');
                    const qrDiv = document.getElementById('qr-code');
                    
                    if (data.skipped) {
                        document.getElementById('main-title').innerHTML = 'Production System Status';
                        statusDiv.className = 'status success';
                        statusDiv.innerHTML = '🌐 Production Mode - WhatsApp Disabled for Stability';
                        qrDiv.innerHTML = '<div style="padding: 20px; background: #e3f2fd; border-radius: 10px;">' +
                            '<h3 style="color: #1976d2; margin-top: 0;">🚀 System Running in Production Mode</h3>' +
                            '<p style="color: #333; margin: 10px 0;">WhatsApp integration is disabled for better stability on production servers.</p>' +
                            '<div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: left;">' +
                            '<h4 style="margin-top: 0; color: #333;">✅ What\'s Working:</h4>' +
                            '<ul style="margin: 0; padding-left: 20px; color: #555;">' +
                            '<li>Alert detection system</li>' +
                            '<li>EMA breakdown strategy</li>' +
                            '<li>Data fetching and analysis</li>' +
                            '<li>Web interface and health checks</li>' +
                            '</ul>' +
                            '</div>' +
                            '<div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: left;">' +
                            '<h4 style="margin-top: 0; color: #856404;">📝 Alert Notifications:</h4>' +
                            '<p style="margin: 0; color: #856404;">All alerts are being logged to the server logs. Check your hosting platform\'s log viewer to see alert notifications.</p>' +
                            '</div>' +
                            '</div>';
                        clearInterval(refreshInterval);
                    } else if (data.authenticated) {
                        statusDiv.className = 'status success';
                        statusDiv.innerHTML = '✅ WhatsApp Connected Successfully!';
                        qrDiv.innerHTML = '<p style="color: green; font-size: 18px;">✅ Authentication Complete!</p>';
                        clearInterval(refreshInterval);
                    } else if (data.qr) {
                        statusDiv.className = 'status waiting';
                        statusDiv.innerHTML = '📱 Scan QR Code with WhatsApp';
                        qrDiv.innerHTML = '<img src="data:image/png;base64,' + data.qr + '" alt="QR Code" class="qr-code">';
                    } else {
                        statusDiv.className = 'status error';
                        statusDiv.innerHTML = '❌ Error: ' + (data.error || 'No QR code available');
                        qrDiv.innerHTML = '<p style="color: red;">Please wait for QR code generation...</p>';
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    document.getElementById('status').className = 'status error';
                    document.getElementById('status').innerHTML = '❌ Connection Error';
                });
        }
        
        // Initial load
        refreshQR();
        
        // Auto-refresh every 30 seconds
        refreshInterval = setInterval(refreshQR, 30000);
    </script>
</body>
</html>
            `);
        });

        // API endpoint for QR code
        this.app.get('/qr', (req, res) => {
            if (process.env.SKIP_WHATSAPP === 'true') {
                res.json({ 
                    skipped: true, 
                    message: 'WhatsApp integration is currently disabled',
                    authenticated: false 
                });
            } else if (this.isAuthenticated) {
                res.json({ authenticated: true });
            } else if (this.currentQR) {
                // Convert QR string to image
                qrcode.toDataURL(this.currentQR, { width: 300 }, (err, url) => {
                    if (err) {
                        res.json({ error: 'Failed to generate QR code image' });
                    } else {
                        // Extract base64 data
                        const base64Data = url.split(',')[1];
                        res.json({ qr: base64Data, authenticated: false });
                    }
                });
            } else {
                res.json({ error: 'No QR code available', authenticated: false });
            }
        });

        // Status endpoint
        this.app.get('/status', (req, res) => {
            res.json({
                authenticated: this.isAuthenticated,
                hasQR: !!this.currentQR,
                timestamp: new Date().toISOString(),
                status: 'healthy',
                uptime: process.uptime()
            });
        });

        // Health check endpoint for Render
        this.app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                service: 'nifty-alert-system',
                port: this.port,
                authenticated: this.isAuthenticated,
                uptime: process.uptime()
            });
        });

        // Root endpoint to show service is running
        this.app.get('/ping', (req, res) => {
            res.status(200).send('pong');
        });

        // API endpoint to check if system is ready
        this.app.get('/ready', (req, res) => {
            res.status(200).json({
                status: 'ready',
                webInterface: true,
                whatsappReady: this.isAuthenticated,
                timestamp: new Date().toISOString()
            });
        });

        // Production status endpoint
        this.app.get('/production-status', (req, res) => {
            const isProduction = process.env.NODE_ENV === 'production';
            const whatsappSkipped = process.env.SKIP_WHATSAPP === 'true';
            
            res.json({
                environment: isProduction ? 'production' : 'development',
                whatsappEnabled: !whatsappSkipped,
                whatsappAuthenticated: this.isAuthenticated,
                platform: process.env.RENDER ? 'render' : 
                          process.env.HEROKU ? 'heroku' : 
                          process.env.VERCEL ? 'vercel' : 'unknown',
                status: 'running',
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
                features: {
                    alertDetection: true,
                    emaStrategy: true,
                    dataFetching: true,
                    webInterface: true,
                    healthCheck: true
                }
            });
        });
    }

    /**
     * Start the web server
     */
    async start() {
        try {
            // In production (Render), use the PORT environment variable
            if (process.env.NODE_ENV === 'production' && process.env.PORT) {
                this.port = parseInt(process.env.PORT);
                console.log(`🌐 Production mode: Using port ${this.port}`);
                
                // Validate port range even in production
                if (isNaN(this.port) || this.port < 1 || this.port > 65535) {
                    console.error(`❌ Invalid port ${process.env.PORT}, falling back to 3000`);
                    this.port = 3000;
                }
            } else {
                // Find an available port for development
                this.port = await findAvailablePort(this.port);
            }
            
            return new Promise((resolve, reject) => {
                this.server = this.app.listen(this.port, '0.0.0.0', (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log(`🌐 Web interface started at http://localhost:${this.port}`);
                        if (process.env.NODE_ENV === 'production') {
                            console.log(`🌐 Production URL: https://${process.env.RENDER_EXTERNAL_HOSTNAME || 'your-app.onrender.com'}`);
                        }
                        logToFile(`INFO: Web interface started on port ${this.port}`);
                        resolve();
                    }
                });
                
                // Handle server errors
                this.server.on('error', (error) => {
                    console.error('❌ Web server error:', error);
                    logToFile(`ERROR: Web server error - ${error.message}`);
                    reject(error);
                });
            });
        } catch (error) {
            console.error('❌ Failed to start web interface:', error.message);
            logToFile(`ERROR: Failed to start web interface - ${error.message}`);
            throw error;
        }
    }

    /**
     * Stop the web server
     */
    stop() {
        if (this.server) {
            try {
                this.server.close();
                console.log('🌐 Web interface stopped');
                logToFile('INFO: Web interface stopped');
            } catch (error) {
                console.error('⚠️ Error stopping web interface:', error.message);
                logToFile(`WARNING: Error stopping web interface - ${error.message}`);
            }
        }
    }

    /**
     * Update QR code
     */
    updateQR(qrString) {
        this.currentQR = qrString;
        this.isAuthenticated = false;
        console.log(`🌐 QR code updated. Visit http://localhost:${this.port} to scan`);
        logToFile(`INFO: QR code updated for web interface`);
    }

    /**
     * Mark as authenticated
     */
    setAuthenticated() {
        this.isAuthenticated = true;
        this.currentQR = null;
        console.log('🌐 WhatsApp authentication successful');
        logToFile('INFO: WhatsApp authenticated via web interface');
    }

    /**
     * Get the web interface URL
     */
    getURL() {
        return `http://localhost:${this.port}`;
    }
}

module.exports = WebInterface;
