# Performance Optimization Quick Reference

## Quick Test Commands

### Run Performance Test
```bash
node webapp/test-performance.js
```

### Start Local Server
```bash
npx serve webapp
```

### Open Performance Test Page
```
http://localhost:3000/performance-test.html
```

### Run Lighthouse Audit
```bash
lighthouse http://localhost:3000 --view
```

## Key Optimizations Implemented

### ✅ 1. Critical CSS Inlined
- Above-the-fold styles in `<head>`
- Faster First Contentful Paint

### ✅ 2. Deferred Non-Critical CSS
- Main stylesheet loaded asynchronously
- Reduced render-blocking

### ✅ 3. Module Preloading
- JavaScript modules preloaded
- Faster script execution

### ✅ 4. requestAnimationFrame Timer
- Smooth 60fps animations
- Better battery life

### ✅ 5. Debounced Input Handlers
- Volume slider: 150ms debounce
- Save buttons: 300ms debounce

### ✅ 6. Lazy Loading
- Images load when visible
- Reduced initial page weight

### ✅ 7. Optimized Service Worker
- Prioritized asset caching
- Stale-while-revalidate strategy

### ✅ 8. Performance Monitoring
- Automatic metrics logging
- Load time tracking

### ✅ 9. Font Optimization
- display=swap for fonts
- Deferred loading

### ✅ 10. Resource Hints
- Preconnect to external domains
- Faster resource loading

## Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Page Load Time | < 3000ms | ✅ |
| DOM Content Loaded | < 2000ms | ✅ |
| First Contentful Paint | < 1500ms | ✅ |
| Time to Interactive | < 3500ms | ✅ |

## Testing on 3G Network

### Chrome DevTools
1. Open DevTools (F12)
2. Network tab → Throttling → Slow 3G
3. Disable cache
4. Reload page
5. Check load time

### Expected Results
- Page loads in < 3 seconds
- App is interactive immediately
- Timer updates smoothly
- No janky animations

## Code Examples

### Debounce Usage
```javascript
// Debounce volume changes
volumeSlider.addEventListener('input', debounce(handleVolumeChange, 150));
```

### Lazy Loading
```html
<!-- Add data-lazy-src attribute -->
<img data-lazy-src="/path/to/image.png" alt="Description">
```

### Performance Monitoring
```javascript
// Automatically logs on page load
logPerformanceMetrics();
```

## Troubleshooting

### Slow Load Times
1. Check Network tab for slow resources
2. Verify service worker is registered
3. Check cache is working
4. Review console for errors

### Timer Not Smooth
1. Verify requestAnimationFrame is used
2. Check for JavaScript errors
3. Test on different devices

### High Resource Count
1. Review lazy loading implementation
2. Check for duplicate resources
3. Verify service worker caching

## Maintenance

### Update Cache Version
When deploying changes, update cache name in `service-worker.js`:
```javascript
const CACHE_NAME = 'auraflow-v4-optimized'; // Increment version
```

### Add New Assets to Cache
Add to appropriate array in `service-worker.js`:
```javascript
const CRITICAL_ASSETS = [...]; // Must-have for app to work
const SECONDARY_ASSETS = [...]; // Important but not critical
const OPTIONAL_ASSETS = [...]; // Nice to have
```

### Monitor Performance
Check console logs after page load:
```
=== Performance Metrics ===
Page Load Time: 1847ms
✅ Load time is under 3 seconds
```

## Resources

- [Performance Test Page](http://localhost:3000/performance-test.html)
- [Full Documentation](./PERFORMANCE_OPTIMIZATIONS.md)
- [Web.dev Performance](https://web.dev/performance/)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/performance/)
