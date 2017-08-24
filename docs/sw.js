const VERSION = '27';
const CACHE_NAME = 'chache_ver_' + VERSION;
const BASE_URL = location.href.replace(/\/[^\/]*$/, '');
const BASE_PATH = location.pathname.replace(/\/[^\/]*$/, '');
const NO_IMAGE = '/noimg.png';
const CACHE_FILES = [
    BASE_PATH + '/',
    BASE_PATH + '/index.html',
    BASE_PATH + '/app.js',
    BASE_PATH + '/img0.png',
    BASE_PATH + NO_IMAGE,
];
self.addEventListener('install', (event) => {
    console.info('install', event);
    event.waitUntil(AddCacheFiles());
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
    const fetchRequest = event.request.clone();
    return fetch(event.request).then((response) => {
        const cacheResponse = response.clone();
        caches.match(url, { cacheName: CACHE_NAME }).then((response) => {
            console.log('Cache hit:', response);
            caches.open(CACHE_NAME).then((cache) => {
            });
        });
        return response;
    }).catch((err) => {
        console.log('fetch error:', err);
        console.log(url.match(/\.png$/));
        if (!url.match(/\.png$/)) {
            throw err;
        }
        console.log(BASE_URL + NO_IMAGE);
        return caches.match(BASE_URL + NO_IMAGE, { cacheName: CACHE_NAME });
    });
});
function DefaultURL(url) { return url.split('?')[0]; }
function AddCache(request) {
    console.log('AddCache:', request.url);
    const fetchRequest = request.clone();
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
}
function AddCacheFiles() {
    return caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(CACHE_FILES).catch((err) => { console.log('error', err); return; });
    });
}
function RemoveOldCache() {
    return caches.keys().then((keys) => {
        return Promise.all(keys.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
                console.log('Remove cache:', cacheName);
            }
            return cacheName !== CACHE_NAME ? caches.delete(cacheName) : Promise.resolve(true);
        }));
    });
}
