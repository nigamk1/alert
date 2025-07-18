const { Client, LocalAuth } = require('whatsapp-web.js');
const { logToFile, formatCurrency, formatTime } = require('./utils');
const WebInterface = require('./webInterface');

/**
 * WhatsApp Alert Sender
 */
class AlertSender {
    constructor() {
        this.client = null;
        this.isReady = false;
        this.targetNumber = process.env.WHATSAPP_TARGET;
        this.webInterface = new WebInterface();
        this.skipWhatsApp = process.env.SKIP_WHATSAPP === 'true';
        
        if (!this.skipWhatsApp) {
            this.initializeClient();
        } else {
            console.log('⚠️ WhatsApp integration skipped (SKIP_WHATSAPP=true)');
            logToFile('INFO: WhatsApp integration skipped');
        }
    }

    /**
     * Initialize WhatsApp client
     */
    initializeClient() {
        // Puppeteer configuration for Render and other cloud platforms
        const puppeteerConfig = {
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        };

        // Use system Chrome if available (for Render)
        if (process.env.PUPPETEER_EXECUTABLE_PATH) {
            puppeteerConfig.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
        }

        this.client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: puppeteerConfig
        });

        this.setupEventHandlers();
    }

    /**
     * Setup WhatsApp client event handlers
     */
    setupEventHandlers() {
        this.client.on('qr', (qr) => {
            console.log('📱 WhatsApp QR Code received. Please scan with your phone:');
            console.log('🌐 Or visit: http://localhost:' + (process.env.WEB_PORT || 3000));
            console.log(qr);
            this.webInterface.updateQR(qr);
            logToFile('INFO: WhatsApp QR code generated. Please scan to authenticate.');
        });

        this.client.on('ready', () => {
            console.log('✅ WhatsApp client is ready!');
            this.isReady = true;
            this.webInterface.setAuthenticated();
            logToFile('INFO: WhatsApp client connected and ready');
        });

        this.client.on('authenticated', () => {
            console.log('✅ WhatsApp client authenticated');
            this.webInterface.setAuthenticated();
            logToFile('INFO: WhatsApp client authenticated successfully');
        });

        this.client.on('auth_failure', (msg) => {
            console.error('❌ WhatsApp authentication failed:', msg);
            logToFile(`ERROR: WhatsApp authentication failed - ${msg}`);
        });

        this.client.on('disconnected', (reason) => {
            console.log('❌ WhatsApp client disconnected:', reason);
            this.isReady = false;
            logToFile(`ERROR: WhatsApp client disconnected - ${reason}`);
        });

        this.client.on('message', (message) => {
            // Optional: Handle incoming messages
            if (message.body.toLowerCase().includes('status')) {
                this.sendMessage(message.from, '🤖 Alert system is active and monitoring Nifty options.');
            }
        });
    }

    /**
     * Initialize WhatsApp client connection
     * @returns {Promise<boolean>} Success status
     */
    async initialize() {
        try {
            // Start web interface first
            await this.webInterface.start();
            
            if (!this.skipWhatsApp && this.client) {
                await this.client.initialize();
            }
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize WhatsApp client:', error);
            logToFile(`ERROR: Failed to initialize WhatsApp client - ${error.message}`);
            
            // Fallback: continue without WhatsApp
            console.log('⚠️ Continuing without WhatsApp integration');
            this.skipWhatsApp = true;
            return true;
        }
    }

    /**
     * Send WhatsApp message
     * @param {string} to - Phone number or chat ID
     * @param {string} message - Message text
     * @returns {Promise<boolean>} Success status
     */
    async sendMessage(to, message) {
        try {
            if (this.skipWhatsApp) {
                console.log('📱 WhatsApp skipped - Message would be:');
                console.log(message);
                logToFile(`WHATSAPP_SKIPPED: ${message}`);
                return true;
            }
            
            if (!this.isReady) {
                console.log('⚠️ WhatsApp client not ready. Message queued.');
                logToFile('WARNING: WhatsApp client not ready for sending message');
                return false;
            }

            await this.client.sendMessage(to, message);
            console.log(`📱 WhatsApp message sent to ${to}`);
            logToFile(`INFO: WhatsApp message sent to ${to}`);
            return true;
        } catch (error) {
            console.error('❌ Failed to send WhatsApp message:', error);
            logToFile(`ERROR: Failed to send WhatsApp message - ${error.message}`);
            return false;
        }
    }

    /**
     * Send bearish entry alert
     * @param {Object} alertData - Alert data from strategy
     * @returns {Promise<boolean>} Success status
     */
    async sendBearishAlert(alertData) {
        const message = this.formatBearishAlertMessage(alertData);
        return await this.sendMessage(this.targetNumber, message);
    }

    /**
     * Format bearish alert message
     * @param {Object} alertData - Alert data
     * @returns {string} Formatted message
     */
    formatBearishAlertMessage(alertData) {
        const message = `🔻 *BEARISH ENTRY TRIGGERED*

📊 *Option:* Nifty ${alertData.optionStrike} PUT
💰 *Entry Price:* ${formatCurrency(alertData.entryPrice)}
⏰ *Time:* ${formatTime(alertData.timestamp)}
📉 *Signal Candle Low:* ${formatCurrency(alertData.signalCandleLow)}

📈 *Technical Analysis:*
• Break below signal low ✅
• Bearish candle ✅
• High volume ✅
• Below EMA200 ✅

📊 *Market Data:*
• Volume: ${alertData.volume.toLocaleString()}
• Volume SMA: ${alertData.volumeSMA.toLocaleString()}
• EMA5: ${formatCurrency(alertData.ema5)}
• EMA200: ${formatCurrency(alertData.ema200)}

🎯 *Strategy:* EMA Breakdown
⚡ *Generated by:* Auto Alert System`;

        return message;
    }

    /**
     * Send test message
     * @returns {Promise<boolean>} Success status
     */
    async sendTestMessage() {
        const testMessage = `🧪 *TEST MESSAGE*

🤖 Alert system is running
⏰ Time: ${formatTime()}
📱 WhatsApp integration: ✅

This is a test message from your Nifty options alert system.`;

        return await this.sendMessage(this.targetNumber, testMessage);
    }

    /**
     * Send system status message
     * @param {Object} statusData - System status data
     * @returns {Promise<boolean>} Success status
     */
    async sendStatusMessage(statusData) {
        const message = `📊 *SYSTEM STATUS*

🔄 *Status:* ${statusData.status}
📈 *Data Points:* ${statusData.dataPoints}
💰 *Current Price:* ${formatCurrency(statusData.currentPrice)}
📊 *EMA5:* ${statusData.ema5 ? formatCurrency(statusData.ema5) : 'N/A'}
📊 *EMA200:* ${statusData.ema200 ? formatCurrency(statusData.ema200) : 'N/A'}
🎯 *Signal Candle:* ${statusData.hasSignalCandle ? '✅ Active' : '❌ None'}
⏰ *Last Update:* ${formatTime(statusData.lastUpdate)}

🤖 *Alert System:* Running`;

        return await this.sendMessage(this.targetNumber, message);
    }

    /**
     * Send error notification
     * @param {string} errorMessage - Error message
     * @returns {Promise<boolean>} Success status
     */
    async sendErrorNotification(errorMessage) {
        const message = `❌ *SYSTEM ERROR*

🚨 Alert system encountered an error:
${errorMessage}

⏰ Time: ${formatTime()}
🔧 Please check the system logs.`;

        return await this.sendMessage(this.targetNumber, message);
    }

    /**
     * Check if WhatsApp client is ready
     * @returns {boolean} Ready status
     */
    isClientReady() {
        return this.isReady;
    }

    /**
     * Get WhatsApp client info
     * @returns {Object} Client information
     */
    getClientInfo() {
        return {
            isReady: this.isReady,
            targetNumber: this.targetNumber,
            hasClient: !!this.client,
            webURL: this.webInterface.getURL()
        };
    }

    /**
     * Destroy WhatsApp client
     */
    async destroy() {
        if (this.client) {
            await this.client.destroy();
            this.isReady = false;
            logToFile('INFO: WhatsApp client destroyed');
        }
        if (this.webInterface) {
            this.webInterface.stop();
        }
    }
}

module.exports = AlertSender;
