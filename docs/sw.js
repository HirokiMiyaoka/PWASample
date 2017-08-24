const VERSION = '20';
const CACHE_NAME = 'chache_ver_' + VERSION;
const BASE_URL = location.href.replace(/\/[^\/]*$/, '');
const BASE_PATH = location.pathname.replace(/\/[^\/]*$/, '');
const CACHE_FILES = [
    BASE_PATH + '/',
    BASE_PATH + '/index.html',
    BASE_PATH + '/app.js',
];
self.addEventListener('install', (event) => {
    console.info('install', event);
    event.waitUntil(RemoveOldCache().then(() => { return AddCacheFiles(); }));
});
self.addEventListener('activate', (event) => {
    console.info('activate', event);
    event.waitUntil(RemoveOldCache());
});
self.addEventListener('sync', (event) => {
    console.info('sync', event);
});
self.addEventListener('fetch', (event) => {
    console.log(navigator.onLine);
    console.log('fetch', event);
    const url = DefaultURL(event.request.url);
    event.respondWith(caches.match(url, { cacheName: CACHE_NAME }).then((response) => {
        console.log('Cache hit:', response);
        if (response) {
            return response;
        }
        const fetchRequest = event.request.clone();
        return fetch(fetchRequest, { credentials: 'include' }).then((response) => {
            if (!response.ok) {
                return response;
            }
            const cacheResponse = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
                cache.put(fetchRequest, cacheResponse);
            });
            return response;
        });
    }).catch(() => { return fetch(event.request); }));
});
function DefaultURL(url) { return url.split('?')[0]; }
function AddCacheFiles() {
    console.log('AddCacheFiles:', CACHE_NAME);
    return caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(CACHE_FILES).catch((err) => { console.log('error', err); return; });
    });
}
function RemoveOldCache() {
    return caches.keys().then((keys) => {
        return Promise.all(keys.map((cacheName) => {
            console.log('Remove cache:', cacheName);
            return cacheName !== CACHE_NAME ? caches.delete(cacheName) : Promise.resolve(true);
        }));
    });
}
