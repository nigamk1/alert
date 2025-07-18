const net = require('net');

/**
 * Check if a port is available
 * @param {number} port - Port to check
 * @returns {Promise<boolean>} True if available
 */
function checkPort(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        
        server.listen(port, () => {
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
    for (let i = 0; i < maxTries; i++) {
        const port = basePort + i;
        const isAvailable = await checkPort(port);
        
        if (isAvailable) {
            return port;
        }
    }
    
    throw new Error(`No available port found starting from ${basePort}`);
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
