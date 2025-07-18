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
        this.port = process.env.PORT || process.env.WEB_PORT || 3000;
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
        <h2>WhatsApp QR Code Authentication</h2>
        
        <div id="status" class="status waiting">
            🔄 Waiting for QR code...
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
                    
                    if (data.authenticated) {
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
                service: 'nifty-alert-system'
            });
        });
    }

    /**
     * Start the web server
     */
    async start() {
        try {
            // Find an available port
            this.port = await findAvailablePort(this.port);
            
            return new Promise((resolve, reject) => {
                this.server = this.app.listen(this.port, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log(`🌐 Web interface started at http://localhost:${this.port}`);
                        logToFile(`INFO: Web interface started on port ${this.port}`);
                        resolve();
                    }
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
