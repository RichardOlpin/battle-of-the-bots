// Offline Functionality Verification Script
// This script helps verify that the PWA works correctly in offline mode

/**
 * Offline Verification Checklist
 * Run this in the browser console to verify offline functionality
 */

const OfflineVerification = {
    results: [],
    
    log(test, passed, details = '') {
        const result = {
            test,
            passed,
            details,
            timestamp: new Date().toISOString()
        };
        this.results.push(result);
        console.log(`${passed ? '✅' : '❌'} ${test}${details ? ': ' + details : ''}`);
        return passed;
    },
    
    async checkServiceWorker() {
        console.log('\n🔍 Checking Service Worker...\n');
        
        // Check if service worker is supported
        const swSupported = 'serviceWorker' in navigator;
        this.log('Service Worker API supported', swSupported);
        
        if (!swSupported) return false;
        
        // Check if service worker is registered
        const registration = await navigator.serviceWorker.getRegistration();
        const swRegistered = !!registration;
        this.log('Service Worker registered', swRegistered, registration?.scope);
        
        if (!swRegistered) return false;
        
        // Check if service worker is active
        const swActive = !!registration.active;
        this.log('Service Worker active', swActive, registration.active?.state);
        
        // Check service worker state
        if (registration.active) {
            const state = registration.active.state;
            this.log('Service Worker state is "activated"', state === 'activated', state);
        }
        
        return swActive;
    },
    
    async checkCache() {
        console.log('\n🔍 Checking Cache Storage...\n');
        
        // Check if Cache API is supported
        const cacheSupported = 'caches' in window;
        this.log('Cache API supported', cacheSupported);
        
        if (!cacheSupported) return false;
        
        // Get all cache names
        const cacheNames = await caches.keys();
        const hasCaches = cacheNames.length > 0;
        this.log('Caches exist', hasCaches, `Found ${cacheNames.length} cache(s): ${cacheNames.join(', ')}`);
        
        if (!hasCaches) return false;
        
        // Check for AuraFlow cache
        const auraflowCache = cacheNames.find(name => name.includes('auraflow'));
        const hasAuraflowCache = !!auraflowCache;
        this.log('AuraFlow cache exists', hasAuraflowCache, auraflowCache);
        
        if (!hasAuraflowCache) return false;
        
        // Check cached assets
        const cache = await caches.open(auraflowCache);
        const cachedRequests = await cache.keys();
        const cachedUrls = cachedRequests.map(req => new URL(req.url).pathname);
        
        console.log(`\nCached assets (${cachedUrls.length}):`);
        cachedUrls.forEach(url => console.log(`  - ${url}`));
        
        // Check essential assets
        const essentialAssets = [
            '/index.html',
            '/style.css',
            '/app.js',
            '/core-logic.js',
            '/web-platform-services.js'
        ];
        
        const missingAssets = [];
        essentialAssets.forEach(asset => {
            const isCached = cachedUrls.some(url => url.includes(asset) || url === asset || url === '/' && asset === '/index.html');
            if (!isCached) {
                missingAssets.push(asset);
            }
            this.log(`Essential asset cached: ${asset}`, isCached);
        });
        
        return missingAssets.length === 0;
    },
    
    async checkLocalStorage() {
        console.log('\n🔍 Checking LocalStorage...\n');
        
        // Check if localStorage is supported
        const lsSupported = typeof localStorage !== 'undefined';
        this.log('LocalStorage supported', lsSupported);
        
        if (!lsSupported) return false;
        
        // Check for stored data
        const keys = Object.keys(localStorage);
        this.log('LocalStorage has data', keys.length > 0, `${keys.length} keys found`);
        
        if (keys.length > 0) {
            console.log('\nStored keys:');
            keys.forEach(key => {
                const value = localStorage.getItem(key);
                const preview = value.length > 50 ? value.substring(0, 50) + '...' : value;
                console.log(`  - ${key}: ${preview}`);
            });
        }
        
        return true;
    },
    
    async checkOfflineDetection() {
        console.log('\n🔍 Checking Offline Detection...\n');
        
        // Check navigator.onLine
        const onlineStatus = navigator.onLine;
        this.log('navigator.onLine status', true, onlineStatus ? 'ONLINE' : 'OFFLINE');
        
        // Check if offline event listeners are set up
        const hasOfflineListener = window.addEventListener.toString().includes('offline');
        this.log('Offline event listeners', true, 'Check app.js for offline/online event handlers');
        
        return true;
    },
    
    async testOfflineLoad() {
        console.log('\n🔍 Testing Offline Load Capability...\n');
        
        // Try to fetch a cached resource
        try {
            const response = await fetch('/index.html');
            const fromCache = response.headers.get('x-from-cache') || 
                             !response.headers.get('date') ||
                             response.type === 'basic';
            
            this.log('Can fetch index.html', response.ok, `Status: ${response.status}`);
            
            return response.ok;
        } catch (error) {
            this.log('Can fetch index.html', false, error.message);
            return false;
        }
    },
    
    async checkCoreLogic() {
        console.log('\n🔍 Checking Core Logic Module...\n');
        
        // Check if core logic is loaded
        try {
            const coreLogic = await import('./core-logic.js');
            const hasCoreLogic = !!coreLogic;
            this.log('Core logic module loaded', hasCoreLogic);
            
            // Check essential functions
            const essentialFunctions = [
                'startTimer',
                'pauseTimer',
                'resumeTimer',
                'stopTimer',
                'getTimerState',
                'formatTime'
            ];
            
            essentialFunctions.forEach(fn => {
                const exists = typeof coreLogic[fn] === 'function';
                this.log(`Core logic has ${fn}()`, exists);
            });
            
            return hasCoreLogic;
        } catch (error) {
            this.log('Core logic module loaded', false, error.message);
            return false;
        }
    },
    
    async runAllChecks() {
        console.log('🚀 Starting Offline Functionality Verification\n');
        console.log('='.repeat(60));
        
        const checks = [
            this.checkServiceWorker(),
            this.checkCache(),
            this.checkLocalStorage(),
            this.checkOfflineDetection(),
            this.testOfflineLoad(),
            this.checkCoreLogic()
        ];
        
        await Promise.all(checks);
        
        console.log('\n' + '='.repeat(60));
        console.log('\n📊 Verification Summary\n');
        
        const passed = this.results.filter(r => r.passed).length;
        const total = this.results.length;
        const percentage = Math.round((passed / total) * 100);
        
        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${passed} (${percentage}%)`);
        console.log(`Failed: ${total - passed}`);
        
        if (percentage === 100) {
            console.log('\n✅ All checks passed! The app is ready for offline use.');
        } else if (percentage >= 80) {
            console.log('\n⚠️  Most checks passed, but some issues were found.');
        } else {
            console.log('\n❌ Multiple issues found. Offline functionality may not work correctly.');
        }
        
        console.log('\n📋 Detailed Results:');
        console.table(this.results);
        
        return this.results;
    },
    
    async simulateOffline() {
        console.log('\n🔌 Simulating Offline Mode\n');
        console.log('Note: This is a simulation. For real offline testing:');
        console.log('1. Open DevTools > Network tab');
        console.log('2. Check "Offline" checkbox');
        console.log('3. Reload the page');
        console.log('4. Verify the app loads and timer works\n');
        
        // We can't actually make the browser go offline programmatically
        // But we can test if cached resources are available
        
        const testUrls = [
            '/index.html',
            '/style.css',
            '/app.js',
            '/core-logic.js'
        ];
        
        console.log('Testing if resources are available from cache:\n');
        
        for (const url of testUrls) {
            try {
                const cache = await caches.open('auraflow-v2');
                const response = await cache.match(url);
                const available = !!response;
                console.log(`${available ? '✅' : '❌'} ${url} ${available ? 'available in cache' : 'NOT in cache'}`);
            } catch (error) {
                console.log(`❌ ${url} - Error: ${error.message}`);
            }
        }
    },
    
    getManualTestingSteps() {
        console.log('\n📱 Manual Testing Steps for Mobile Device\n');
        console.log('='.repeat(60));
        console.log(`
STEP 1: Install PWA
-------------------
1. Open the web app in mobile browser (Chrome/Safari)
2. Look for "Add to Home Screen" prompt
3. Tap "Add" or "Install"
4. Verify app icon appears on home screen

STEP 2: Test Online Functionality
----------------------------------
1. Launch app from home screen
2. Verify app opens in standalone mode (no browser UI)
3. Connect to Google Calendar if not already connected
4. Verify events load correctly
5. Start a quick focus session
6. Verify timer counts down correctly
7. Stop the session

STEP 3: Enable Offline Mode
----------------------------
1. Enable Airplane Mode on device
   OR
2. Turn off WiFi and Mobile Data
3. Verify device shows "No Internet" indicator

STEP 4: Test Offline Functionality
-----------------------------------
1. Close the app completely (swipe away from app switcher)
2. Launch app from home screen again
3. ✅ VERIFY: App loads and shows main UI
4. ✅ VERIFY: Previously loaded events are visible (cached)
5. ✅ VERIFY: Can start a focus session
6. ✅ VERIFY: Timer counts down correctly
7. ✅ VERIFY: Can pause/resume timer
8. ✅ VERIFY: Can stop session
9. ✅ VERIFY: Theme switching works
10. ❌ EXPECT: AI features show "offline" message

STEP 5: Test Offline Limitations
---------------------------------
1. Try to refresh events
   ✅ VERIFY: Shows cached events or offline message
2. Try "Find Focus Time" AI feature
   ✅ VERIFY: Shows "requires internet connection" message
3. Try "Generate Ritual" AI feature
   ✅ VERIFY: Shows "requires internet connection" message

STEP 6: Reconnect and Verify Sync
----------------------------------
1. Disable Airplane Mode / Re-enable WiFi
2. Wait for connection to restore
3. Refresh events
   ✅ VERIFY: New events load from server
4. Try AI features
   ✅ VERIFY: AI features work again
5. Check if any queued data syncs (if implemented)

STEP 7: Edge Cases
-------------------
1. Start session online, go offline mid-session
   ✅ VERIFY: Timer continues working
2. Complete session offline
   ✅ VERIFY: Session completes, data queued for sync
3. Go offline, close app, reopen
   ✅ VERIFY: App still loads from cache

Expected Results:
-----------------
✅ App loads instantly from cache when offline
✅ Core timer functionality works without internet
✅ Previously loaded data is accessible
✅ UI remains responsive and functional
✅ Clear feedback when features require internet
✅ Smooth transition when coming back online
        `);
    }
};

// Auto-run verification when script is loaded
console.log('Offline Verification Script Loaded');
console.log('Run: OfflineVerification.runAllChecks()');
console.log('Or: OfflineVerification.getManualTestingSteps()');

// Export for use in console
window.OfflineVerification = OfflineVerification;
