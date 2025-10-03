#!/usr/bin/env node

/**
 * AuraFlow Desktop Readiness Verification Script
 * 
 * This script verifies that the web application is ready for desktop testing
 * by checking for required files, validating structure, and testing basic functionality.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
        log(`✓ ${description}`, 'green');
        return true;
    } else {
        log(`✗ ${description} - Missing: ${filePath}`, 'red');
        return false;
    }
}

function checkFileContent(filePath, searchStrings, description) {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
        log(`✗ ${description} - File not found: ${filePath}`, 'red');
        return false;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const missing = searchStrings.filter(str => !content.includes(str));

    if (missing.length === 0) {
        log(`✓ ${description}`, 'green');
        return true;
    } else {
        log(`✗ ${description} - Missing: ${missing.join(', ')}`, 'red');
        return false;
    }
}

async function runVerification() {
    log('\n🔍 AuraFlow Desktop Readiness Verification\n', 'cyan');
    log('=' .repeat(60), 'blue');

    let totalChecks = 0;
    let passedChecks = 0;

    // Section 1: Core Files
    log('\n📁 Core Files:', 'yellow');
    totalChecks++;
    if (checkFile('index.html', 'index.html exists')) passedChecks++;
    
    totalChecks++;
    if (checkFile('style.css', 'style.css exists')) passedChecks++;
    
    totalChecks++;
    if (checkFile('app.js', 'app.js exists')) passedChecks++;
    
    totalChecks++;
    if (checkFile('core-logic.js', 'core-logic.js exists')) passedChecks++;
    
    totalChecks++;
    if (checkFile('web-platform-services.js', 'web-platform-services.js exists')) passedChecks++;

    // Section 2: PWA Files
    log('\n📱 PWA Files:', 'yellow');
    totalChecks++;
    if (checkFile('manifest.json', 'manifest.json exists')) passedChecks++;
    
    totalChecks++;
    if (checkFile('service-worker.js', 'service-worker.js exists')) passedChecks++;

    // Section 3: HTML Structure
    log('\n🏗️  HTML Structure:', 'yellow');
    totalChecks++;
    if (checkFileContent('index.html', ['id="app"', 'id="auth-screen"', 'id="events-screen"', 'id="session-screen"'], 
        'All required screens present')) passedChecks++;
    
    totalChecks++;
    if (checkFileContent('index.html', ['id="timer-display"', 'id="pause-btn"', 'id="stop-btn"'], 
        'Timer controls present')) passedChecks++;
    
    totalChecks++;
    if (checkFileContent('index.html', ['theme-light-button', 'theme-dark-button', 'theme-calm-button'], 
        'Theme buttons present')) passedChecks++;
    
    totalChecks++;
    if (checkFileContent('index.html', ['id="find-focus-btn"', 'id="generate-ritual-btn"'], 
        'AI feature buttons present')) passedChecks++;

    // Section 4: JavaScript Modules
    log('\n⚙️  JavaScript Modules:', 'yellow');
    totalChecks++;
    if (checkFileContent('core-logic.js', ['export function startTimer', 'export function pauseTimer', 'export function stopTimer'], 
        'Core timer functions exported')) passedChecks++;
    
    totalChecks++;
    if (checkFileContent('core-logic.js', ['export function initializeSession', 'export function getSessionState'], 
        'Session management functions exported')) passedChecks++;
    
    totalChecks++;
    if (checkFileContent('app.js', ['import * as CoreLogic', 'import * as Platform'], 
        'App.js imports modules correctly')) passedChecks++;
    
    totalChecks++;
    if (checkFileContent('web-platform-services.js', ['export async function saveData', 'export async function getData'], 
        'Storage functions exported')) passedChecks++;
    
    totalChecks++;
    if (checkFileContent('web-platform-services.js', ['export async function createNotification', 'export async function requestNotificationPermission'], 
        'Notification functions exported')) passedChecks++;

    // Section 5: PWA Configuration
    log('\n🔧 PWA Configuration:', 'yellow');
    totalChecks++;
    if (checkFileContent('manifest.json', ['"name"', '"short_name"', '"start_url"', '"display"'], 
        'Manifest has required fields')) passedChecks++;
    
    totalChecks++;
    if (checkFileContent('manifest.json', ['"icons"', '192', '512'], 
        'Manifest defines icons')) passedChecks++;
    
    totalChecks++;
    if (checkFileContent('service-worker.js', ['CACHE_NAME', 'install', 'fetch', 'activate'], 
        'Service worker has required events')) passedChecks++;

    // Section 6: Icon Files
    log('\n🎨 Icon Files:', 'yellow');
    totalChecks++;
    if (checkFile('icons/icon-192.png', 'icon-192.png exists')) passedChecks++;
    
    totalChecks++;
    if (checkFile('icons/icon-512.png', 'icon-512.png exists')) passedChecks++;

    // Section 7: Testing Files
    log('\n🧪 Testing Files:', 'yellow');
    totalChecks++;
    if (checkFile('DESKTOP_TESTING_GUIDE.md', 'Desktop testing guide exists')) passedChecks++;
    
    totalChecks++;
    if (checkFile('test-desktop.html', 'Automated test suite exists')) passedChecks++;

    // Summary
    log('\n' + '='.repeat(60), 'blue');
    log('\n📊 Verification Summary:', 'cyan');
    log(`   Total Checks: ${totalChecks}`, 'blue');
    log(`   Passed: ${passedChecks}`, 'green');
    log(`   Failed: ${totalChecks - passedChecks}`, totalChecks === passedChecks ? 'green' : 'red');
    
    const successRate = Math.round((passedChecks / totalChecks) * 100);
    log(`   Success Rate: ${successRate}%\n`, successRate === 100 ? 'green' : 'yellow');

    if (successRate === 100) {
        log('✅ All checks passed! The web application is ready for desktop testing.', 'green');
        log('\n📖 Next Steps:', 'cyan');
        log('   1. Start a local server (see DESKTOP_TESTING_GUIDE.md)', 'blue');
        log('   2. Open http://localhost:8080 in your browser', 'blue');
        log('   3. Run automated tests at http://localhost:8080/test-desktop.html', 'blue');
        log('   4. Follow the manual testing checklist in DESKTOP_TESTING_GUIDE.md\n', 'blue');
        return true;
    } else {
        log('⚠️  Some checks failed. Please review the errors above.', 'yellow');
        log('   Fix the missing files or content before proceeding with testing.\n', 'yellow');
        return false;
    }
}

// Run verification
runVerification().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    log(`\n❌ Verification failed with error: ${error.message}`, 'red');
    process.exit(1);
});
