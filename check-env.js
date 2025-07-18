#!/usr/bin/env node

/**
 * Environment Configuration Checker
 * Validates all required environment variables and system settings
 */

const fs = require('fs');
const path = require('path');

// Required environment variables
const REQUIRED_ENV_VARS = [
    'RUN_INTERVAL_MINUTES',
    'WHATSAPP_TARGET'
];

// Optional environment variables with defaults
const OPTIONAL_ENV_VARS = {
    'NODE_ENV': 'development',
    'PORT': '3000',
    'WEB_PORT': '3000',
    'SKIP_WHATSAPP': 'false',
    'LOG_LEVEL': 'info'
};

// Production-specific variables
const PRODUCTION_ENV_VARS = [
    'RENDER_EXTERNAL_HOSTNAME'
];

function checkEnvironment() {
    console.log('🔍 Checking environment configuration...\n');
    
    let hasErrors = false;
    
    // Check Node.js version
    const nodeVersion = process.version;
    console.log(`📊 Node.js version: ${nodeVersion}`);
    
    // Check if .env file exists
    const envFilePath = path.join(__dirname, '.env');
    if (fs.existsSync(envFilePath)) {
        console.log('✅ .env file found');
        require('dotenv').config();
    } else {
        console.log('⚠️  .env file not found (using environment variables)');
    }
    
    // Check required environment variables
    console.log('\n📋 Required Environment Variables:');
    REQUIRED_ENV_VARS.forEach(varName => {
        const value = process.env[varName];
        if (value) {
            console.log(`✅ ${varName}: ${varName.includes('TARGET') ? '[HIDDEN]' : value}`);
        } else {
            console.log(`❌ ${varName}: NOT SET`);
            hasErrors = true;
        }
    });
    
    // Check optional environment variables
    console.log('\n🔧 Optional Environment Variables:');
    Object.entries(OPTIONAL_ENV_VARS).forEach(([varName, defaultValue]) => {
        const value = process.env[varName] || defaultValue;
        console.log(`🔹 ${varName}: ${value}${process.env[varName] ? '' : ' (default)'}`);
    });
    
    // Check production-specific variables
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
        console.log('\n🚀 Production Environment Variables:');
        PRODUCTION_ENV_VARS.forEach(varName => {
            const value = process.env[varName];
            if (value) {
                console.log(`✅ ${varName}: ${value}`);
            } else {
                console.log(`⚠️  ${varName}: NOT SET (recommended for production)`);
            }
        });
    }
    
    // Check directories
    console.log('\n📁 Directory Structure:');
    const directories = ['logs', 'src'];
    directories.forEach(dir => {
        const dirPath = path.join(__dirname, dir);
        if (fs.existsSync(dirPath)) {
            console.log(`✅ ${dir}/`);
        } else {
            console.log(`❌ ${dir}/ (missing)`);
            hasErrors = true;
        }
    });
    
    // Check important files
    console.log('\n📄 Important Files:');
    const files = ['index.js', 'start.js', 'package.json'];
    files.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            console.log(`✅ ${file}`);
        } else {
            console.log(`❌ ${file} (missing)`);
            hasErrors = true;
        }
    });
    
    // Final result
    console.log('\n' + '='.repeat(50));
    if (hasErrors) {
        console.log('❌ Environment check FAILED');
        console.log('Please fix the issues above before running the application.');
        process.exit(1);
    } else {
        console.log('✅ Environment check PASSED');
        console.log('All required configurations are properly set.');
        
        // Show startup command
        console.log('\n🚀 To start the application:');
        console.log('   npm start');
        console.log('   or');
        console.log('   node start.js');
    }
}

// Run the check
checkEnvironment();
