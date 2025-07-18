const cron = require('node-cron');
const { logToFile, isMarketOpen, formatTime } = require('./utils');

/**
 * Scheduler for running the alert system
 */
class Scheduler {
    constructor(dataFetcher, strategy, alertSender) {
        this.dataFetcher = dataFetcher;
        this.strategy = strategy;
        this.alertSender = alertSender;
        this.intervalMinutes = parseInt(process.env.RUN_INTERVAL_MINUTES) || 1;
        this.cronJob = null;
        this.intervalId = null;
        this.isRunning = false;
        this.lastRunTime = null;
        this.runCount = 0;
        this.errorCount = 0;
        this.alertCount = 0;
    }

    /**
     * Start the scheduler
     */
    start() {
        console.log(`🚀 Starting scheduler - Running every ${this.intervalMinutes} minute(s)`);
        logToFile(`INFO: Scheduler started - Interval: ${this.intervalMinutes} minutes`);

        // Use setInterval for more reliable execution
        this.intervalId = setInterval(async () => {
            await this.runCycle();
        }, this.intervalMinutes * 60 * 1000);

        this.isRunning = true;
        
        // Run initial cycle
        setTimeout(async () => {
            await this.runCycle();
        }, 5000); // Wait 5 seconds before first run
    }

    /**
     * Start scheduler with cron (alternative method)
     */
    startWithCron() {
        console.log(`🚀 Starting cron scheduler - Running every ${this.intervalMinutes} minute(s)`);
        logToFile(`INFO: Cron scheduler started - Interval: ${this.intervalMinutes} minutes`);

        // Create cron pattern for every N minutes
        const cronPattern = `*/${this.intervalMinutes} * * * *`;
        
        this.cronJob = cron.schedule(cronPattern, async () => {
            await this.runCycle();
        }, {
            scheduled: true,
            timezone: "Asia/Kolkata"
        });

        this.isRunning = true;
        
        // Run initial cycle
        setTimeout(async () => {
            await this.runCycle();
        }, 5000);
    }

    /**
     * Run a single cycle of the strategy
     */
    async runCycle() {
        try {
            this.runCount++;
            this.lastRunTime = new Date();
            
            console.log(`\n🔄 Running cycle #${this.runCount} at ${formatTime()}`);
            
            // Check if market is open
            if (!isMarketOpen()) {
                console.log('⏰ Market is closed. Skipping cycle.');
                logToFile('INFO: Market closed - Skipping strategy execution');
                return;
            }

            // Check if WhatsApp is ready
            if (!this.alertSender.isClientReady()) {
                console.log('📱 WhatsApp client not ready. Attempting to reconnect...');
                logToFile('WARNING: WhatsApp client not ready');
                // Could implement reconnection logic here
                return;
            }

            // Step 1: Fetch new data
            console.log('📊 Fetching market data...');
            const newData = await this.dataFetcher.getATMPutData();
            
            if (!newData) {
                console.log('❌ No data received. Skipping cycle.');
                this.errorCount++;
                return;
            }

            // Step 2: Run strategy analysis
            console.log('🧠 Running strategy analysis...');
            const strategyResult = await this.strategy.runStrategy();
            
            // Step 3: Handle results
            if (strategyResult.signal) {
                console.log('🚨 SIGNAL DETECTED! Sending alert...');
                logToFile(`ALERT: Bearish entry signal detected - ${JSON.stringify(strategyResult)}`);
                
                // Send WhatsApp alert
                const alertSent = await this.alertSender.sendBearishAlert(strategyResult);
                
                if (alertSent) {
                    this.alertCount++;
                    console.log('✅ Alert sent successfully!');
                    logToFile('INFO: Alert sent successfully via WhatsApp');
                } else {
                    console.log('❌ Failed to send alert!');
                    logToFile('ERROR: Failed to send alert via WhatsApp');
                }
            } else {
                console.log(`ℹ️ No signal - ${strategyResult.reason}`);
                
                // Log additional info if available
                if (strategyResult.currentPrice) {
                    console.log(`💰 Current price: ₹${strategyResult.currentPrice}`);
                }
                if (strategyResult.hasSignalCandle) {
                    console.log('🎯 Signal candle active - Waiting for entry conditions');
                }
            }

            // Step 4: Log cycle completion
            console.log(`✅ Cycle #${this.runCount} completed at ${formatTime()}`);
            
        } catch (error) {
            this.errorCount++;
            console.error('❌ Error in run cycle:', error.message);
            logToFile(`ERROR: Run cycle failed - ${error.message}`);
            
            // Send error notification if WhatsApp is ready
            if (this.alertSender.isClientReady()) {
                await this.alertSender.sendErrorNotification(`Cycle error: ${error.message}`);
            }
        }
    }

    /**
     * Stop the scheduler
     */
    stop() {
        console.log('🛑 Stopping scheduler...');
        logToFile('INFO: Scheduler stopped');
        
        if (this.cronJob) {
            this.cronJob.stop();
            this.cronJob = null;
        }
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        this.isRunning = false;
    }

    /**
     * Get scheduler status
     * @returns {Object} Scheduler status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            intervalMinutes: this.intervalMinutes,
            lastRunTime: this.lastRunTime,
            runCount: this.runCount,
            errorCount: this.errorCount,
            alertCount: this.alertCount,
            errorRate: this.runCount > 0 ? (this.errorCount / this.runCount * 100).toFixed(2) : 0,
            marketOpen: isMarketOpen(),
            whatsappReady: this.alertSender.isClientReady()
        };
    }

    /**
     * Send status update via WhatsApp
     */
    async sendStatusUpdate() {
        try {
            const strategyStatus = this.strategy.getStatus();
            const schedulerStatus = this.getStatus();
            
            const statusMessage = `📊 *SYSTEM STATUS REPORT*

🔄 *Scheduler:*
• Status: ${schedulerStatus.isRunning ? '✅ Running' : '❌ Stopped'}
• Cycles: ${schedulerStatus.runCount}
• Errors: ${schedulerStatus.errorCount} (${schedulerStatus.errorRate}%)
• Alerts: ${schedulerStatus.alertCount}

🏪 *Market:*
• Status: ${schedulerStatus.marketOpen ? '🟢 Open' : '🔴 Closed'}
• Current Price: ${strategyStatus.currentPrice ? `₹${strategyStatus.currentPrice}` : 'N/A'}

📱 *WhatsApp:*
• Status: ${schedulerStatus.whatsappReady ? '✅ Ready' : '❌ Not Ready'}

🧠 *Strategy:*
• Data Points: ${strategyStatus.dataPoints}
• Signal Candle: ${strategyStatus.hasSignalCandle ? '✅ Active' : '❌ None'}
• EMA5: ${strategyStatus.ema5 ? `₹${strategyStatus.ema5.toFixed(2)}` : 'N/A'}
• EMA200: ${strategyStatus.ema200 ? `₹${strategyStatus.ema200.toFixed(2)}` : 'N/A'}

⏰ *Last Run:* ${schedulerStatus.lastRunTime ? formatTime(schedulerStatus.lastRunTime) : 'Never'}`;

            await this.alertSender.sendMessage(process.env.WHATSAPP_TARGET, statusMessage);
            console.log('📊 Status update sent');
            logToFile('INFO: Status update sent via WhatsApp');
            
        } catch (error) {
            console.error('❌ Error sending status update:', error.message);
            logToFile(`ERROR: Failed to send status update - ${error.message}`);
        }
    }

    /**
     * Schedule periodic status updates
     */
    scheduleStatusUpdates() {
        // Send status every 30 minutes during market hours
        const statusCron = cron.schedule('*/30 * * * *', async () => {
            if (isMarketOpen()) {
                await this.sendStatusUpdate();
            }
        }, {
            scheduled: true,
            timezone: "Asia/Kolkata"
        });

        console.log('📊 Status updates scheduled every 30 minutes');
        logToFile('INFO: Status updates scheduled every 30 minutes');
    }

    /**
     * Run a manual test cycle
     */
    async runTestCycle() {
        console.log('🧪 Running manual test cycle...');
        logToFile('INFO: Manual test cycle initiated');
        
        try {
            // Initialize with sample data for testing
            this.dataFetcher.initializeSampleData();
            
            // Run strategy
            const result = await this.strategy.runStrategy();
            
            console.log('🧪 Test result:', result);
            logToFile(`TEST: Manual test result - ${JSON.stringify(result)}`);
            
            // Send test message
            await this.alertSender.sendTestMessage();
            
            return result;
        } catch (error) {
            console.error('❌ Test cycle error:', error.message);
            logToFile(`ERROR: Test cycle failed - ${error.message}`);
            throw error;
        }
    }
}

module.exports = Scheduler;
