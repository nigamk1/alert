const fs = require('fs');
const path = require('path');

/**
 * Utility functions for the alert system
 */

/**
 * Log message to file with timestamp
 * @param {string} message - Message to log
 * @param {string} logFile - Path to log file
 */
function logToFile(message, logFile = './logs/signals.log') {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const logMessage = `[${timestamp}] ${message}\n`;
    
    try {
        // Ensure logs directory exists
        const logDir = path.dirname(logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        
        fs.appendFileSync(logFile, logMessage);
        console.log(`📝 ${logMessage.trim()}`);
    } catch (error) {
        console.error('Error writing to log file:', error);
    }
}

/**
 * Get ATM (At The Money) strike price for options
 * @param {number} spotPrice - Current spot price
 * @param {number} strikeInterval - Strike price interval (usually 50 for Nifty)
 * @returns {number} ATM strike price
 */
function getATMStrike(spotPrice, strikeInterval = 50) {
    return Math.round(spotPrice / strikeInterval) * strikeInterval;
}

/**
 * Calculate percentage change between two values
 * @param {number} oldValue - Previous value
 * @param {number} newValue - Current value
 * @returns {number} Percentage change
 */
function calculatePercentageChange(oldValue, newValue) {
    return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Check if candle is bearish
 * @param {number} open - Open price
 * @param {number} close - Close price
 * @returns {boolean} True if bearish
 */
function isBearishCandle(open, close) {
    return close < open;
}

/**
 * Check if candle is bullish
 * @param {number} open - Open price
 * @param {number} close - Close price
 * @returns {boolean} True if bullish
 */
function isBullishCandle(open, close) {
    return close > open;
}

/**
 * Calculate candle body size as percentage of close price
 * @param {number} open - Open price
 * @param {number} close - Close price
 * @returns {number} Body size percentage
 */
function getCandleBodySizePercent(open, close) {
    return Math.abs(close - open) / close * 100;
}

/**
 * Check if entire candle is above EMA
 * @param {number} open - Open price
 * @param {number} high - High price
 * @param {number} low - Low price
 * @param {number} close - Close price
 * @param {number} ema - EMA value
 * @returns {boolean} True if entire candle is above EMA
 */
function isCandleAboveEMA(open, high, low, close, ema) {
    return open > ema && high > ema && low > ema && close > ema;
}

/**
 * Format currency value
 * @param {number} value - Value to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(value) {
    return `₹${value.toFixed(2)}`;
}

/**
 * Format time for display
 * @param {Date} date - Date object
 * @returns {string} Formatted time string
 */
function formatTime(date = new Date()) {
    return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Kolkata'
    });
}

/**
 * Check if current time is within trading hours
 * @returns {boolean} True if within trading hours
 */
function isMarketOpen() {
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    
    const hour = istTime.getHours();
    const minute = istTime.getMinutes();
    const day = istTime.getDay();
    
    // Check if it's a weekday (Monday = 1, Friday = 5)
    if (day === 0 || day === 6) {
        return false; // Weekend
    }
    
    // Market hours: 9:15 AM to 3:30 PM IST
    const marketStart = 9 * 60 + 15; // 9:15 AM in minutes
    const marketEnd = 15 * 60 + 30;  // 3:30 PM in minutes
    const currentMinutes = hour * 60 + minute;
    
    return currentMinutes >= marketStart && currentMinutes <= marketEnd;
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validate environment variables
 * @returns {boolean} True if all required env vars are present
 */
function validateEnvironment() {
    const requiredVars = [
        'WHATSAPP_TARGET',
        'NSE_URL',
        'RUN_INTERVAL_MINUTES'
    ];
    
    for (const varName of requiredVars) {
        if (!process.env[varName]) {
            console.error(`❌ Missing required environment variable: ${varName}`);
            return false;
        }
    }
    
    return true;
}

module.exports = {
    logToFile,
    getATMStrike,
    calculatePercentageChange,
    isBearishCandle,
    isBullishCandle,
    getCandleBodySizePercent,
    isCandleAboveEMA,
    formatCurrency,
    formatTime,
    isMarketOpen,
    sleep,
    validateEnvironment
};
