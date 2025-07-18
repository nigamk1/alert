#!/usr/bin/env node

require('dotenv').config();

console.log('🔍 Environment Debug Information:');
console.log('================================');
console.log('All PORT-related environment variables:');
console.log(`PORT: "${process.env.PORT}" (type: ${typeof process.env.PORT})`);
console.log(`WEB_PORT: "${process.env.WEB_PORT}" (type: ${typeof process.env.WEB_PORT})`);
console.log(`NODE_ENV: "${process.env.NODE_ENV}"`);
console.log('');

console.log('All environment variables containing "PORT":');
Object.keys(process.env).forEach(key => {
    if (key.includes('PORT') || key.includes('port')) {
        console.log(`${key}: "${process.env[key]}"`);
    }
});
console.log('');

console.log('Port resolution logic:');
const rawPort = process.env.PORT || process.env.WEB_PORT || '3000';
const parsedPort = parseInt(rawPort);
console.log(`Raw port: "${rawPort}"`);
console.log(`Parsed port: ${parsedPort}`);
console.log(`Is valid: ${!isNaN(parsedPort) && parsedPort >= 1 && parsedPort <= 65535}`);
console.log('');

console.log('Testing port parsing with different values:');
const testPorts = ['3000', '10000', '100000', '0', '65536', 'abc', ''];
testPorts.forEach(testPort => {
    const parsed = parseInt(testPort);
    const valid = !isNaN(parsed) && parsed >= 1 && parsed <= 65535;
    console.log(`"${testPort}" -> ${parsed} (valid: ${valid})`);
});
