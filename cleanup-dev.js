#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Development cleanup script to handle file locks and process cleanup
 */

console.log('🧹 Cleaning up development environment...');

// Kill any remaining Chrome and Node processes
console.log('🔄 Stopping Chrome processes...');
exec('taskkill /F /IM chrome.exe /T', { windowsHide: true }, (error) => {
    if (!error) console.log('✅ Chrome processes stopped');
});

exec('taskkill /F /IM node.exe /T', { windowsHide: true }, (error) => {
    if (!error) console.log('✅ Node processes stopped');
});

// Clean up WhatsApp session files
setTimeout(() => {
    const authPath = path.join(__dirname, '.wwebjs_auth');
    
    try {
        if (fs.existsSync(authPath)) {
            fs.rmSync(authPath, { recursive: true, force: true });
            console.log('✅ WhatsApp session files cleaned');
        }
    } catch (error) {
        console.log('⚠️ Could not clean session files (they may be in use)');
    }
    
    // Clean log files that might be locked
    const logsPath = path.join(__dirname, 'logs');
    try {
        if (fs.existsSync(logsPath)) {
            const files = fs.readdirSync(logsPath);
            files.forEach(file => {
                try {
                    const filePath = path.join(logsPath, file);
                    if (file.endsWith('.log')) {
                        // Don't delete, just try to release any locks
                        fs.accessSync(filePath, fs.constants.W_OK);
                    }
                } catch (e) {
                    // File might be locked, ignore
                }
            });
            console.log('✅ Log files checked');
        }
    } catch (error) {
        console.log('⚠️ Could not access log files');
    }
    
    console.log('🎉 Cleanup completed!');
    console.log('💡 You can now run: npm run dev');
    
}, 1000); // Wait 1 second for processes to fully terminate
