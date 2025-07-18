const net = require('net');

/**
 * Check if a port is available
 * @param {number} port - Port to check
 * @returns {Promise<boolean>} True if available
 */
function checkPort(port) {
    return new Promise((resolve) => {
        // Ensure port is a number and within valid range
        const portNum = parseInt(port);
        if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
            console.error(`❌ Invalid port number: ${port}`);
            resolve(false);
            return;
        }
        
        const server = net.createServer();
        
        server.listen(portNum, () => {
            server.close(() => {
                resolve(true);
            });
        });
        
        server.on('error', () => {
            resolve(false);
        });
    });
}

/**
 * Find an available port starting from a base port
 * @param {number} basePort - Starting port
 * @param {number} maxTries - Maximum number of ports to try
 * @returns {Promise<number>} Available port
 */
async function findAvailablePort(basePort = 3000, maxTries = 10) {
    // Ensure basePort is a number and within valid range
    const startPort = parseInt(basePort);
    
    if (isNaN(startPort) || startPort < 1 || startPort > 65535) {
        console.error(`❌ Invalid base port: ${basePort}, using 3000`);
        return await findAvailablePort(3000, maxTries);
    }
    
    for (let i = 0; i < maxTries; i++) {
        const port = startPort + i;
        
        // Skip if port would exceed valid range
        if (port > 65535) {
            console.log(`⚠️ Port ${port} exceeds valid range, breaking`);
            break;
        }
        
        const isAvailable = await checkPort(port);
        
        if (isAvailable) {
            return port;
        }
    }
    
    throw new Error(`No available port found starting from ${startPort}`);
}

/**
 * Kill process on port (Windows/Unix compatible)
 * @param {number} port - Port to free
 */
async function killProcessOnPort(port) {
    const { exec } = require('child_process');
    const isWindows = process.platform === 'win32';
    
    return new Promise((resolve, reject) => {
        const command = isWindows
            ? `netstat -ano | findstr :${port}`
            : `lsof -ti:${port}`;
        
        exec(command, (error, stdout) => {
            if (error) {
                resolve(false);
                return;
            }
            
            if (isWindows) {
                const lines = stdout.trim().split('\n');
                const pids = lines.map(line => {
                    const parts = line.trim().split(/\s+/);
                    return parts[parts.length - 1];
                }).filter(pid => pid && pid !== '0');
                
                if (pids.length > 0) {
                    const killCommand = `taskkill /F /PID ${pids.join(' /PID ')}`;
                    exec(killCommand, (killError) => {
                        resolve(!killError);
                    });
                } else {
                    resolve(false);
                }
            } else {
                const pids = stdout.trim().split('\n').filter(pid => pid);
                if (pids.length > 0) {
                    const killCommand = `kill -9 ${pids.join(' ')}`;
                    exec(killCommand, (killError) => {
                        resolve(!killError);
                    });
                } else {
                    resolve(false);
                }
            }
        });
    });
}

module.exports = {
    checkPort,
    findAvailablePort,
    killProcessOnPort
};
