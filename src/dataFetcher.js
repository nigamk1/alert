const axios = require('axios');
const { logToFile, getATMStrike, sleep } = require('./utils');

/**
 * Data fetcher for NSE options data
 */
class DataFetcher {
    constructor() {
        this.baseURL = process.env.NSE_URL;
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        };
        this.lastFetchTime = 0;
        this.cachedData = null;
        this.historicalData = [];
    }

    /**
     * Fetch option chain data from NSE
     * @returns {Promise<Object>} Option chain data
     */
    async fetchOptionChain() {
        try {
            // Rate limiting - don't fetch more than once per 5 seconds
            const now = Date.now();
            if (now - this.lastFetchTime < 5000) {
                await sleep(5000 - (now - this.lastFetchTime));
            }

            const response = await axios.get(this.baseURL, { 
                headers: this.headers,
                timeout: 10000
            });

            this.lastFetchTime = Date.now();
            this.cachedData = response.data;
            
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching option chain:', error.message);
            logToFile(`ERROR: Failed to fetch option chain - ${error.message}`);
            
            // Return cached data if available
            if (this.cachedData) {
                logToFile('INFO: Using cached data due to fetch failure');
                return this.cachedData;
            }
            
            throw error;
        }
    }

    /**
     * Extract ATM PUT option data
     * @returns {Promise<Object>} ATM PUT option data with OHLC
     */
    async getATMPutData() {
        try {
            const optionChain = await this.fetchOptionChain();
            
            if (!optionChain || !optionChain.records || !optionChain.records.data) {
                throw new Error('Invalid option chain data structure');
            }

            const spotPrice = optionChain.records.underlyingValue;
            const atmStrike = getATMStrike(spotPrice);
            
            // Find ATM PUT option
            const atmPutData = optionChain.records.data.find(record => 
                record.strikePrice === atmStrike && record.PE
            );

            if (!atmPutData || !atmPutData.PE) {
                throw new Error(`ATM PUT option not found for strike ${atmStrike}`);
            }

            const putOption = atmPutData.PE;
            
            // Create OHLC data structure
            const ohlcData = {
                timestamp: new Date(),
                strike: atmStrike,
                spotPrice: spotPrice,
                open: putOption.openPrice || putOption.lastPrice,
                high: putOption.dayHigh || putOption.lastPrice,
                low: putOption.dayLow || putOption.lastPrice,
                close: putOption.lastPrice,
                volume: putOption.totalTradedVolume || 0,
                oi: putOption.openInterest || 0,
                bid: putOption.bidPrice || 0,
                ask: putOption.askPrice || 0,
                impliedVolatility: putOption.impliedVolatility || 0
            };

            // Add to historical data
            this.historicalData.push(ohlcData);
            
            // Keep only last 250 candles for calculations
            if (this.historicalData.length > 250) {
                this.historicalData = this.historicalData.slice(-250);
            }

            logToFile(`DATA: ATM PUT ${atmStrike} - Price: ₹${ohlcData.close}, Volume: ${ohlcData.volume}`);
            
            return ohlcData;
        } catch (error) {
            console.error('❌ Error extracting ATM PUT data:', error.message);
            logToFile(`ERROR: Failed to extract ATM PUT data - ${error.message}`);
            throw error;
        }
    }

    /**
     * Get historical OHLC data for calculations
     * @returns {Array} Array of OHLC data
     */
    getHistoricalData() {
        return this.historicalData;
    }

    /**
     * Get current spot price
     * @returns {Promise<number>} Current Nifty spot price
     */
    async getSpotPrice() {
        try {
            const optionChain = await this.fetchOptionChain();
            return optionChain.records.underlyingValue;
        } catch (error) {
            console.error('❌ Error getting spot price:', error.message);
            throw error;
        }
    }

    /**
     * Alternative method to fetch data using different NSE endpoint
     * @returns {Promise<Object>} Alternative data source
     */
    async fetchAlternativeData() {
        try {
            const alternativeURL = 'https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%2050';
            const response = await axios.get(alternativeURL, { 
                headers: this.headers,
                timeout: 10000
            });

            return response.data;
        } catch (error) {
            console.error('❌ Error fetching alternative data:', error.message);
            throw error;
        }
    }

    /**
     * Initialize with some sample data for testing
     */
    initializeSampleData() {
        const sampleData = [
            {
                timestamp: new Date(Date.now() - 5 * 60000),
                strike: 22100,
                spotPrice: 22120,
                open: 45.5,
                high: 47.2,
                low: 44.8,
                close: 46.1,
                volume: 15000,
                oi: 250000
            },
            {
                timestamp: new Date(Date.now() - 4 * 60000),
                strike: 22100,
                spotPrice: 22115,
                open: 46.1,
                high: 48.3,
                low: 45.5,
                close: 47.8,
                volume: 18000,
                oi: 255000
            },
            {
                timestamp: new Date(Date.now() - 3 * 60000),
                strike: 22100,
                spotPrice: 22108,
                open: 47.8,
                high: 49.1,
                low: 46.9,
                close: 48.5,
                volume: 22000,
                oi: 260000
            }
        ];

        this.historicalData = sampleData;
        logToFile('INFO: Sample data initialized for testing');
    }
}

module.exports = DataFetcher;
