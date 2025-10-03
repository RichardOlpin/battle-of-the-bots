#!/usr/bin/env node

/**
 * Performance Test Script
 * Tests the performance optimizations in the AuraFlow web app
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 AuraFlow Performance Optimization Test\n');

// Test 1: Check if critical CSS is inlined
console.log('Test 1: Critical CSS Inlining');
const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const hasCriticalCSS = indexHtml.includes('<style>') && indexHtml.includes('Critical above-the-fold styles');
console.log(hasCriticalCSS ? '✅ PASS: Critical CSS is inlined' : '❌ FAIL: Critical CSS not found');

// Test 2: Check if CSS is deferred
console.log('\nTest 2: Deferred Non-Critical CSS');
const hasDeferredCSS = indexHtml.includes('rel="preload"') && indexHtml.includes('as="style"');
console.log(hasDeferredCSS ? '✅ PASS: CSS is deferred' : '❌ FAIL: CSS not deferred');

// Test 3: Check if modules are preloaded
console.log('\nTest 3: Module Preloading');
const hasModulePreload = indexHtml.includes('rel="modulepreload"');
console.log(hasModulePreload ? '✅ PASS: Modules are preloaded' : '❌ FAIL: Modules not preloaded');

// Test 4: Check if requestAnimationFrame is used in core-logic
console.log('\nTest 4: requestAnimationFrame for Timer');
const coreLogic = fs.readFileSync(path.join(__dirname, 'core-logic.js'), 'utf8');
const usesRAF = coreLogic.includes('requestAnimationFrame') && coreLogic.includes('cancelAnimationFrame');
console.log(usesRAF ? '✅ PASS: Timer uses requestAnimationFrame' : '❌ FAIL: Timer not using requestAnimationFrame');

// Test 5: Check if debounce function exists
console.log('\nTest 5: Debounce Function');
const appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
const hasDebounce = appJs.includes('function debounce(') && appJs.includes('debounce(handleVolumeChange');
console.log(hasDebounce ? '✅ PASS: Debounce function implemented' : '❌ FAIL: Debounce not found');

// Test 6: Check if lazy loading is implemented
console.log('\nTest 6: Lazy Loading');
const hasLazyLoading = appJs.includes('setupLazyLoading') && appJs.includes('IntersectionObserver');
console.log(hasLazyLoading ? '✅ PASS: Lazy loading implemented' : '❌ FAIL: Lazy loading not found');

// Test 7: Check service worker optimizations
console.log('\nTest 7: Service Worker Optimizations');
const serviceWorker = fs.readFileSync(path.join(__dirname, 'service-worker.js'), 'utf8');
const hasOptimizedSW = serviceWorker.includes('CRITICAL_ASSETS') && 
                       serviceWorker.includes('SECONDARY_ASSETS') &&
                       serviceWorker.includes('stale-while-revalidate');
console.log(hasOptimizedSW ? '✅ PASS: Service worker optimized' : '❌ FAIL: Service worker not optimized');

// Test 8: Check performance monitoring
console.log('\nTest 8: Performance Monitoring');
const hasPerformanceMonitoring = appJs.includes('logPerformanceMetrics') && 
                                  appJs.includes('window.performance.timing');
console.log(hasPerformanceMonitoring ? '✅ PASS: Performance monitoring implemented' : '❌ FAIL: Performance monitoring not found');

// Test 9: Check if fonts are optimized
console.log('\nTest 9: Font Loading Optimization');
const hasFontOptimization = indexHtml.includes('display=swap') && indexHtml.includes('media="print"');
console.log(hasFontOptimization ? '✅ PASS: Fonts are optimized' : '❌ FAIL: Fonts not optimized');

// Test 10: Check if preconnect is used
console.log('\nTest 10: Resource Hints (Preconnect)');
const hasPreconnect = indexHtml.includes('rel="preconnect"');
console.log(hasPreconnect ? '✅ PASS: Preconnect hints present' : '❌ FAIL: Preconnect not found');

// Summary
console.log('\n' + '='.repeat(50));
console.log('Performance Optimization Test Complete');
console.log('='.repeat(50));

// Count passes
const tests = [
    hasCriticalCSS,
    hasDeferredCSS,
    hasModulePreload,
    usesRAF,
    hasDebounce,
    hasLazyLoading,
    hasOptimizedSW,
    hasPerformanceMonitoring,
    hasFontOptimization,
    hasPreconnect
];

const passed = tests.filter(t => t).length;
const total = tests.length;

console.log(`\nResults: ${passed}/${total} tests passed`);

if (passed === total) {
    console.log('🎉 All performance optimizations are in place!');
    process.exit(0);
} else {
    console.log('⚠️  Some optimizations are missing. Please review the failed tests.');
    process.exit(1);
}
