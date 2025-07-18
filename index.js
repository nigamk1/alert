require('dotenv').config();
const DataFetcher = require('./src/dataFetcher');
const EMABreakdownStrategy = require('./src/strategy');
const AlertSender = require('./src/alertSender');
const Scheduler = require('./src/scheduler');
const { logToFile, validateEnvironment, isMarketOpen, formatTime } = require('./src/utils');

/**
 * Main Application Class
 */
class AlertSystem {
    constructor() {
        this.dataFetcher = null;
        this.strategy = null;
        this.alertSender = null;
        this.scheduler = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the alert system
     */
    async initialize() {
        try {
            console.log('🚀 Initializing Nifty Alert System...');
            logToFile('INFO: Alert system initialization started');

            // Validate environment
            if (!validateEnvironment()) {
                throw new Error('Environment validation failed');
            }

            // Initialize components
            console.log('📊 Initializing data fetcher...');
            this.dataFetcher = new DataFetcher();

            console.log('🧠 Initializing strategy...');
            this.strategy = new EMABreakdownStrategy(this.dataFetcher);

        console.log('📱 Initializing WhatsApp client...');
        this.alertSender = new AlertSender();
        
        console.log('🔄 Initializing scheduler...');
        this.scheduler = new Scheduler(this.dataFetcher, this.strategy, this.alertSender);

        // Initialize WhatsApp client
        console.log('🌐 Starting web interface...');
        await this.alertSender.initialize();            this.isInitialized = true;
            console.log('✅ Alert system initialized successfully!');
            logToFile('INFO: Alert system initialized successfully');

            // Show system info
            this.showSystemInfo();

        } catch (error) {
            console.error('❌ Failed to initialize alert system:', error.message);
            logToFile(`ERROR: System initialization failed - ${error.message}`);
            throw error;
        }
    }

    /**
     * Start the alert system
     */
    async start() {
        try {
            if (!this.isInitialized) {
                throw new Error('System not initialized. Call initialize() first.');
            }

            console.log('🚀 Starting alert system...');
            logToFile('INFO: Alert system started');

            // Wait for WhatsApp to be ready
        console.log('📱 Waiting for WhatsApp client to be ready...');
        console.log('🌐 QR Code available at: http://localhost:' + (process.env.WEB_PORT || 3000));
        await this.waitForWhatsApp();            // Start scheduler
            this.scheduler.start();

            // Schedule status updates
            this.scheduler.scheduleStatusUpdates();

            // Send startup notification
            await this.sendStartupNotification();

            console.log('✅ Alert system is now running!');
            logToFile('INFO: Alert system is now running');

        } catch (error) {
            console.error('❌ Failed to start alert system:', error.message);
            logToFile(`ERROR: System start failed - ${error.message}`);
            throw error;
        }
    }

    /**
     * Wait for WhatsApp client to be ready
     */
    async waitForWhatsApp(maxWaitTime = 60000) {
        const startTime = Date.now();
        
        while (!this.alertSender.isClientReady() && (Date.now() - startTime) < maxWaitTime) {
            console.log('⏳ Waiting for WhatsApp client...');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        if (!this.alertSender.isClientReady()) {
            console.log('⚠️ WhatsApp client not ready within timeout. Continuing anyway...');
            logToFile('WARNING: WhatsApp client not ready within timeout');
        } else {
            console.log('✅ WhatsApp client is ready!');
        }
    }

    /**
     * Send startup notification
     */
    async sendStartupNotification() {
        try {
            const message = `🚀 *ALERT SYSTEM STARTED*

🤖 *System:* Nifty EMA Breakdown Alert
⏰ *Time:* ${formatTime()}
📈 *Strategy:* EMA Breakdown Bearish
🎯 *Target:* Nifty 50 Options PUT
📊 *Interval:* ${process.env.RUN_INTERVAL_MINUTES} minute(s)

🏪 *Market Status:* ${isMarketOpen() ? '🟢 Open' : '🔴 Closed'}

✅ System is now monitoring and ready to send alerts!`;

            await this.alertSender.sendMessage(process.env.WHATSAPP_TARGET, message);
            console.log('📱 Startup notification sent');
            logToFile('INFO: Startup notification sent');
        } catch (error) {
            console.error('❌ Failed to send startup notification:', error.message);
            logToFile(`ERROR: Failed to send startup notification - ${error.message}`);
        }
    }

    /**
     * Stop the alert system
     */
    async stop() {
        try {
            console.log('🛑 Stopping alert system...');
            logToFile('INFO: Alert system stopping');

            if (this.scheduler) {
                this.scheduler.stop();
            }

            // Send shutdown notification
            await this.sendShutdownNotification();

            if (this.alertSender) {
                await this.alertSender.destroy();
            }

            console.log('✅ Alert system stopped');
            logToFile('INFO: Alert system stopped');

        } catch (error) {
            console.error('❌ Error stopping alert system:', error.message);
            logToFile(`ERROR: System stop failed - ${error.message}`);
        }
    }

    /**
     * Send shutdown notification
     */
    async sendShutdownNotification() {
        try {
            const message = `🛑 *ALERT SYSTEM STOPPED*

⏰ *Time:* ${formatTime()}
🤖 *System:* Shutdown initiated

📊 *Final Status:*
${this.scheduler ? `• Cycles: ${this.scheduler.getStatus().runCount}` : ''}
${this.scheduler ? `• Alerts: ${this.scheduler.getStatus().alertCount}` : ''}

System has been stopped and will no longer monitor for signals.`;

            await this.alertSender.sendMessage(process.env.WHATSAPP_TARGET, message);
            console.log('📱 Shutdown notification sent');
            logToFile('INFO: Shutdown notification sent');
        } catch (error) {
            console.error('❌ Failed to send shutdown notification:', error.message);
        }
    }

    /**
     * Show system information
     */
    showSystemInfo() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 NIFTY ALERT SYSTEM - CONFIGURATION');
        console.log('='.repeat(50));
        console.log(`🎯 Strategy: ${process.env.ALERT_STRATEGY}`);
        console.log(`📱 WhatsApp Target: ${process.env.WHATSAPP_TARGET}`);
        console.log(`⏰ Run Interval: ${process.env.RUN_INTERVAL_MINUTES} minute(s)`);
        console.log(`📊 EMA Fast: ${process.env.EMA_FAST_PERIOD} periods`);
        console.log(`📊 EMA Slow: ${process.env.EMA_SLOW_PERIOD} periods`);
        console.log(`📊 Volume SMA: ${process.env.VOLUME_SMA_PERIOD} periods`);
        console.log(`📈 Min Body Size: ${process.env.MIN_BODY_SIZE_PERCENT}%`);
        console.log(`🏪 Market Status: ${isMarketOpen() ? '🟢 Open' : '🔴 Closed'}`);
        console.log(`🌐 Web Interface: http://localhost:${process.env.WEB_PORT || 3000}`);
        console.log('='.repeat(50));
        console.log('\n🚨 ENTRY CONDITIONS:');
        console.log('1. Signal candle entirely above EMA5 ✅');
        console.log('2. Next candle breaks signal low ✅');
        console.log('3. Next candle is bearish ✅');
        console.log('4. Volume > 20-period SMA ✅');
        console.log('5. Price below EMA200 (downtrend) ✅');
        console.log('='.repeat(50) + '\n');
    }

    /**
     * Run a test cycle
     */
    async runTest() {
        try {
            console.log('🧪 Running test cycle...');
            
            if (!this.isInitialized) {
                await this.initialize();
            }

            await this.waitForWhatsApp();
            
            const result = await this.scheduler.runTestCycle();
            
            console.log('🧪 Test completed:', result);
            return result;
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
            throw error;
        }
    }

    /**
     * Get system status
     */
    getStatus() {
        if (!this.isInitialized) {
            return { status: 'Not initialized' };
        }

        return {
            initialized: this.isInitialized,
            scheduler: this.scheduler ? this.scheduler.getStatus() : null,
            strategy: this.strategy ? this.strategy.getStatus() : null,
            whatsapp: this.alertSender ? this.alertSender.getClientInfo() : null,
            market: {
                isOpen: isMarketOpen(),
                currentTime: formatTime()
            }
        };
    }
}

/**
 * Handle graceful shutdown
 */
async function gracefulShutdown(alertSystem) {
    console.log('\n🛑 Graceful shutdown initiated...');
    
    try {
        await alertSystem.stop();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error.message);
        process.exit(1);
    }
}

/**
 * Main execution
 */
async function main() {
    const alertSystem = new AlertSystem();
    
    try {
        // Handle process signals
        process.on('SIGINT', () => gracefulShutdown(alertSystem));
        process.on('SIGTERM', () => gracefulShutdown(alertSystem));
        process.on('uncaughtException', (error) => {
            console.error('❌ Uncaught exception:', error);
            logToFile(`ERROR: Uncaught exception - ${error.message}`);
            gracefulShutdown(alertSystem);
        });

        // Check command line arguments
        const args = process.argv.slice(2);
        
        if (args.includes('--test')) {
            // Run test mode
            await alertSystem.runTest();
            process.exit(0);
        } else if (args.includes('--status')) {
            // Show status
            await alertSystem.initialize();
            const status = alertSystem.getStatus();
            console.log('📊 System Status:', JSON.stringify(status, null, 2));
            process.exit(0);
        } else {
            // Normal startup
            await alertSystem.initialize();
            await alertSystem.start();
            
            // Keep the process running
            console.log('🔄 System is running. Press Ctrl+C to stop.');
            
            // Optional: Send periodic heartbeat
            setInterval(() => {
                console.log(`💓 Heartbeat: ${formatTime()} - System running`);
            }, 300000); // Every 5 minutes
        }
        
    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        logToFile(`FATAL: ${error.message}`);
        process.exit(1);
    }
}

// Run if this file is executed directly
if (require.main === module) {
    main();
}

module.exports = AlertSystem;
