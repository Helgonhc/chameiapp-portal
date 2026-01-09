const CACHE_NAME = 'eletricom-os-v1';
const ASSETS = [
    '/',
    '/manifest.json',
    '/pwa-icon-192.png',
    '/pwa-icon-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Don't cache non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Don't cache Supabase auth or API requests
    if (url.hostname.includes('supabase.co') || url.pathname.startsWith('/api/')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
