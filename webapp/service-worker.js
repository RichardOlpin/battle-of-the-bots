// Service Worker for AuraFlow PWA
// Provides offline functionality through caching strategies

const CACHE_NAME = 'auraflow-v3-optimized';

// Essential assets to cache for offline functionality
// Prioritized by importance for initial load
const CRITICAL_ASSETS = [
    '/',
    '/index.html',
    '/app.js',
    '/core-logic.js',
    '/web-platform-services.js'
];

const SECONDARY_ASSETS = [
    '/style.css',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

const OPTIONAL_ASSETS = [
    '/icons/icon128.png',
    '/icons/icon48.png',
    '/icons/icon16.png'
];

const ASSETS_TO_CACHE = [...CRITICAL_ASSETS, ...SECONDARY_ASSETS, ...OPTIONAL_ASSETS];

// API endpoints that should NOT be cached (security: no authenticated data)
// These endpoints may contain user-specific or sensitive data
const NO_CACHE_URLS = [
    '/auth/',
    '/calendar/events',
    '/sessions',
    '/scheduling/',
    '/ritual/',
    '/api/'
];

// Only cache public, static assets - never cache:
// - Authenticated API responses
// - User-specific data
// - Dynamic content with personal information

// Install event - cache essential files with priority
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(async (cache) => {
                console.log('[Service Worker] Caching critical assets first');
                
                // Cache critical assets first for faster initial load
                try {
                    await cache.addAll(CRITICAL_ASSETS);
                    console.log('[Service Worker] Critical assets cached');
                } catch (error) {
                    console.error('[Service Worker] Failed to cache critical assets:', error);
                    throw error;
                }
                
                // Cache secondary assets
                try {
                    await cache.addAll(SECONDARY_ASSETS);
                    console.log('[Service Worker] Secondary assets cached');
                } catch (error) {
                    console.warn('[Service Worker] Some secondary assets failed to cache:', error);
                }
                
                // Cache optional assets (don't fail if these don't load)
                for (const asset of OPTIONAL_ASSETS) {
                    try {
                        await cache.add(asset);
                    } catch (error) {
                        console.warn('[Service Worker] Optional asset failed to cache:', asset);
                    }
                }
                
                console.log('[Service Worker] Installation complete');
            })
            .then(() => self.skipWaiting())
            .catch((error) => {
                console.error('[Service Worker] Installation failed:', error);
            })
    );
});

// Fetch event - cache-first strategy for static assets, network-first for API
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip chrome-extension and other non-http(s) requests
    if (!event.request.url.startsWith('http')) {
        return;
    }

    // Check if this is an API request that should not be cached
    const isAPIRequest = NO_CACHE_URLS.some(url => event.request.url.includes(url));

    if (isAPIRequest) {
        // Network-first strategy for API requests
        event.respondWith(
            fetch(event.request)
                .catch((error) => {
                    console.error('[Service Worker] API fetch failed (offline):', error);
                    // Return a custom offline response for API calls
                    return new Response(
                        JSON.stringify({ error: 'Offline', message: 'This request will be queued' }),
                        { 
                            status: 503,
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );
                })
        );
        return;
    }

    // Security check: Don't cache requests with Authorization headers
    const hasAuthHeader = event.request.headers.has('Authorization');
    if (hasAuthHeader) {
        console.log('[Service Worker] Skipping cache for authenticated request');
        event.respondWith(fetch(event.request));
        return;
    }

    // Optimized cache-first strategy with stale-while-revalidate for better performance
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Fetch from network in background to update cache
                const fetchPromise = fetch(event.request)
                    .then((response) => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200 || response.type === 'error') {
                            return response;
                        }

                        // Security: Don't cache responses with Set-Cookie or authentication headers
                        if (response.headers.has('Set-Cookie') || 
                            response.headers.has('Authorization')) {
                            console.log('[Service Worker] Skipping cache for response with auth headers');
                            return response;
                        }

                        // Only cache public assets (same-origin or CORS-enabled)
                        if (response.type !== 'basic' && response.type !== 'cors') {
                            console.log('[Service Worker] Skipping cache for opaque response');
                            return response;
                        }

                        // Clone the response as it can only be consumed once
                        const responseToCache = response.clone();

                        // Update cache in background (stale-while-revalidate)
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch((error) => {
                        console.error('[Service Worker] Fetch failed:', error);
                        // Return cached index.html as fallback for navigation requests
                        if (event.request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                        throw error;
                    });

                // Return cached response immediately if available, otherwise wait for network
                if (cachedResponse) {
                    console.log('[Service Worker] Serving from cache:', event.request.url);
                    return cachedResponse;
                }

                console.log('[Service Worker] Fetching from network:', event.request.url);
                return fetchPromise;
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => {
                            // Remove caches that don't match current version
                            return cacheName !== CACHE_NAME;
                        })
                        .map((cacheName) => {
                            console.log('[Service Worker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => {
                console.log('[Service Worker] Activation complete');
                return self.clients.claim();
            })
    );
});
