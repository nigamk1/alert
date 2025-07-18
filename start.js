#!/usr/bin/env node

const AlertSystem = require('./index.js');

/**
 * Enhanced startup script with better error handling
 */
async function startApplication() {
    console.log('🚀 Starting Nifty Alert System...');
    console.log(`📊 Node.js version: ${process.version}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📡 Port: ${process.env.PORT || process.env.WEB_PORT || 3000}`);
    
    const system = new AlertSystem();
    
    try {
        // Initialize the system
        await system.initialize();
        
        // Start the system
        await system.start();
        
        // Handle graceful shutdown
        const gracefulShutdown = async (signal) => {
            console.log(`\n📴 Received ${signal}. Starting graceful shutdown...`);
            try {
                await system.stop();
                console.log('✅ Graceful shutdown completed');
                process.exit(0);
            } catch (error) {
                console.error('❌ Error during shutdown:', error);
                process.exit(1);
            }
        };
        
        // Handle various shutdown signals
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGQUIT', () => gracefulShutdown('SIGQUIT'));
        
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('❌ Uncaught Exception:', error);
            gracefulShutdown('uncaughtException');
        });
        
        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
            gracefulShutdown('unhandledRejection');
        });
        
        console.log('🔄 System is running. Press Ctrl+C to stop.');
        
    } catch (error) {
        console.error('❌ Failed to start application:', error);
        process.exit(1);
    }
}

// Start the application
startApplication().catch(error => {
    console.error('❌ Critical startup error:', error);
    process.exit(1);
});
