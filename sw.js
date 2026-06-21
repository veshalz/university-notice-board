const CACHE_NAME = 'edusmart-cache-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json'
];

// 1. Install Event: Cache our core files
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Core assets cached perfectly.');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// 2. Activate Event: Clean up old caches if we update the app
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        })
    );
});

// 3. Fetch Event: Serve from cache first, then fall back to network
self.addEventListener('fetch', event => {
    // Only cache GET requests
    if (event.request.method !== 'GET') return;
    
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // Return cached version if found, otherwise grab from the internet
                return cachedResponse || fetch(event.request);
            })
    );
});