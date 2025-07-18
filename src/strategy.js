const { EMA, SMA } = require('technicalindicators');
const { 
    logToFile, 
    isBearishCandle, 
    getCandleBodySizePercent, 
    isCandleAboveEMA,
    formatCurrency,
    formatTime
} = require('./utils');

/**
 * EMA Breakdown Strategy Implementation
 */
class EMABreakdownStrategy {
    constructor(dataFetcher) {
        this.dataFetcher = dataFetcher;
        this.emaFastPeriod = parseInt(process.env.EMA_FAST_PERIOD) || 5;
        this.emaSlowPeriod = parseInt(process.env.EMA_SLOW_PERIOD) || 200;
        this.volumeSmaPeriod = parseInt(process.env.VOLUME_SMA_PERIOD) || 20;
        this.minBodySizePercent = parseFloat(process.env.MIN_BODY_SIZE_PERCENT) || 0.1;
        
        this.signalCandle = null;
        this.lastAlertTime = 0;
        this.alertCooldown = 5 * 60 * 1000; // 5 minutes cooldown between alerts
    }

    /**
     * Calculate EMA values for the given period
     * @param {Array} prices - Array of prices
     * @param {number} period - EMA period
     * @returns {Array} EMA values
     */
    calculateEMA(prices, period) {
        if (prices.length < period) {
            return [];
        }
        
        const emaValues = EMA.calculate({
            period: period,
            values: prices
        });
        
        return emaValues;
    }

    /**
     * Calculate SMA values for volume
     * @param {Array} volumes - Array of volumes
     * @param {number} period - SMA period
     * @returns {Array} SMA values
     */
    calculateVolumeSMA(volumes, period) {
        if (volumes.length < period) {
            return [];
        }
        
        const smaValues = SMA.calculate({
            period: period,
            values: volumes
        });
        
        return smaValues;
    }

    /**
     * Check if signal candle conditions are met
     * @param {Object} candle - OHLC candle data
     * @param {number} ema5 - EMA5 value
     * @returns {boolean} True if signal candle conditions met
     */
    isSignalCandle(candle, ema5) {
        // Check if entire candle is above EMA5
        const aboveEMA = isCandleAboveEMA(candle.open, candle.high, candle.low, candle.close, ema5);
        
        // Check minimum body size
        const bodySize = getCandleBodySizePercent(candle.open, candle.close);
        const hasMinBodySize = bodySize >= this.minBodySizePercent;
        
        if (aboveEMA && hasMinBodySize) {
            logToFile(`SIGNAL CANDLE: Entire candle above EMA5 (${ema5.toFixed(2)}), Body size: ${bodySize.toFixed(2)}%`);
            return true;
        }
        
        return false;
    }

    /**
     * Check entry conditions on the next candle
     * @param {Object} currentCandle - Current candle data
     * @param {Object} signalCandle - Previous signal candle
     * @param {number} ema200 - EMA200 value
     * @param {number} volumeSMA - Volume SMA value
     * @returns {Object} Entry result with conditions
     */
    checkEntryConditions(currentCandle, signalCandle, ema200, volumeSMA) {
        const conditions = {
            breaksBelowSignalLow: false,
            isBearish: false,
            hasHighVolume: false,
            isBelowEMA200: false,
            allMet: false
        };

        // 1. Check if price breaks below signal candle low
        conditions.breaksBelowSignalLow = currentCandle.low < signalCandle.low;

        // 2. Check if current candle is bearish
        conditions.isBearish = isBearishCandle(currentCandle.open, currentCandle.close);

        // 3. Check if volume is higher than SMA
        conditions.hasHighVolume = volumeSMA > 0 && currentCandle.volume > volumeSMA;

        // 4. Check if price is below EMA200 (downtrend)
        conditions.isBelowEMA200 = currentCandle.close < ema200;

        // All conditions must be met
        conditions.allMet = conditions.breaksBelowSignalLow && 
                           conditions.isBearish && 
                           conditions.hasHighVolume && 
                           conditions.isBelowEMA200;

        return conditions;
    }

    /**
     * Run the strategy analysis
     * @returns {Promise<Object>} Strategy result
     */
    async runStrategy() {
        try {
            const historicalData = this.dataFetcher.getHistoricalData();
            
            if (historicalData.length < Math.max(this.emaSlowPeriod, this.volumeSmaPeriod) + 2) {
                logToFile(`INFO: Insufficient data for analysis. Need at least ${Math.max(this.emaSlowPeriod, this.volumeSmaPeriod) + 2} candles, have ${historicalData.length}`);
                return { signal: false, reason: 'Insufficient historical data' };
            }

            // Extract price and volume arrays
            const closePrices = historicalData.map(candle => candle.close);
            const volumes = historicalData.map(candle => candle.volume);

            // Calculate indicators
            const ema5Values = this.calculateEMA(closePrices, this.emaFastPeriod);
            const ema200Values = this.calculateEMA(closePrices, this.emaSlowPeriod);
            const volumeSMAValues = this.calculateVolumeSMA(volumes, this.volumeSmaPeriod);

            if (ema5Values.length < 2 || ema200Values.length < 2 || volumeSMAValues.length < 2) {
                return { signal: false, reason: 'Insufficient indicator data' };
            }

            // Get current and previous candles
            const currentCandle = historicalData[historicalData.length - 1];
            const previousCandle = historicalData[historicalData.length - 2];

            // Get current indicator values
            const currentEMA5 = ema5Values[ema5Values.length - 1];
            const currentEMA200 = ema200Values[ema200Values.length - 1];
            const currentVolumeSMA = volumeSMAValues[volumeSMAValues.length - 1];

            // Get previous indicator values
            const previousEMA5 = ema5Values[ema5Values.length - 2];

            // Check for signal candle in previous candle
            if (!this.signalCandle && this.isSignalCandle(previousCandle, previousEMA5)) {
                this.signalCandle = previousCandle;
                logToFile(`SIGNAL CANDLE DETECTED: Low at ${formatCurrency(this.signalCandle.low)} at ${formatTime(this.signalCandle.timestamp)}`);
            }

            // If we have a signal candle, check entry conditions
            if (this.signalCandle) {
                const entryConditions = this.checkEntryConditions(
                    currentCandle, 
                    this.signalCandle, 
                    currentEMA200, 
                    currentVolumeSMA
                );

                // Log condition analysis
                logToFile(`ENTRY CONDITIONS: Break=${entryConditions.breaksBelowSignalLow}, Bearish=${entryConditions.isBearish}, Volume=${entryConditions.hasHighVolume}, EMA200=${entryConditions.isBelowEMA200}`);

                if (entryConditions.allMet) {
                    // Check cooldown to prevent spam alerts
                    const now = Date.now();
                    if (now - this.lastAlertTime < this.alertCooldown) {
                        return { 
                            signal: false, 
                            reason: 'Alert cooldown active',
                            timeRemaining: Math.ceil((this.alertCooldown - (now - this.lastAlertTime)) / 1000)
                        };
                    }

                    // Generate alert
                    const alertData = {
                        signal: true,
                        timestamp: new Date(),
                        optionStrike: currentCandle.strike,
                        entryPrice: currentCandle.close,
                        signalCandleLow: this.signalCandle.low,
                        currentPrice: currentCandle.close,
                        volume: currentCandle.volume,
                        volumeSMA: currentVolumeSMA,
                        ema5: currentEMA5,
                        ema200: currentEMA200,
                        conditions: entryConditions
                    };

                    this.lastAlertTime = now;
                    this.signalCandle = null; // Reset signal candle

                    logToFile(`🚨 BEARISH ENTRY SIGNAL: ${formatCurrency(alertData.entryPrice)} on ${alertData.optionStrike} PUT`);
                    
                    return alertData;
                }
            }

            // Reset signal candle if too old (more than 5 candles)
            if (this.signalCandle) {
                const candleAge = historicalData.length - historicalData.findIndex(c => c.timestamp === this.signalCandle.timestamp);
                if (candleAge > 5) {
                    logToFile('INFO: Signal candle expired, resetting');
                    this.signalCandle = null;
                }
            }

            return { 
                signal: false, 
                reason: 'No entry conditions met',
                currentPrice: currentCandle.close,
                ema5: currentEMA5,
                ema200: currentEMA200,
                hasSignalCandle: !!this.signalCandle
            };

        } catch (error) {
            console.error('❌ Strategy error:', error.message);
            logToFile(`ERROR: Strategy execution failed - ${error.message}`);
            return { signal: false, reason: 'Strategy execution error', error: error.message };
        }
    }

    /**
     * Get strategy status and indicators
     * @returns {Object} Current strategy status
     */
    getStatus() {
        const historicalData = this.dataFetcher.getHistoricalData();
        
        if (historicalData.length === 0) {
            return { status: 'No data available' };
        }

        const currentCandle = historicalData[historicalData.length - 1];
        const closePrices = historicalData.map(candle => candle.close);
        
        let ema5 = null, ema200 = null;
        
        if (closePrices.length >= this.emaFastPeriod) {
            const ema5Values = this.calculateEMA(closePrices, this.emaFastPeriod);
            ema5 = ema5Values[ema5Values.length - 1];
        }
        
        if (closePrices.length >= this.emaSlowPeriod) {
            const ema200Values = this.calculateEMA(closePrices, this.emaSlowPeriod);
            ema200 = ema200Values[ema200Values.length - 1];
        }

        return {
            status: 'Active',
            dataPoints: historicalData.length,
            currentPrice: currentCandle.close,
            ema5: ema5,
            ema200: ema200,
            hasSignalCandle: !!this.signalCandle,
            signalCandleLow: this.signalCandle ? this.signalCandle.low : null,
            lastUpdate: currentCandle.timestamp
        };
    }
}

module.exports = EMABreakdownStrategy;
