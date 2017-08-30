const VERSION = '33';
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
self.addEventListener('push', (event) => {
    console.log('push', event);
    event.waitUntil(self.registration.showNotification('Push Received', {
        body: 'Message',
        icon: './icon-144.png',
        tag: 'push-notification-tag',
    }));
});
self.addEventListener('notificationclick', (event) => {
    console.log('notificationclick', event);
    event.notification.close();
    event.waitUntil(clients.matchAll({ type: "window" }).then((clientList) => {
        for (let i = 0; i < clientList.length; ++i) {
            const client = clientList[i];
            if (client.url == '/' && 'focus' in client) {
                return client.focus();
            }
        }
        if (clients.openWindow) {
            return clients.openWindow('/');
        }
    }));
}, false);
self.addEventListener('fetch', (event) => {
    console.log(navigator.onLine);
    console.log('fetch', event);
    const url = DefaultURL(event.request.url);
    const fetchRequest = event.request.clone();
    return event.respondWith(fetch(event.request).then((response) => {
        if (!response.ok) {
            throw 'notfound';
        }
        const cacheResponse = response.clone();
        caches.match(url, { cacheName: CACHE_NAME }).then((response) => {
            if (!response) {
                return;
            }
            console.log('Cache hit:', response);
            caches.open(CACHE_NAME).then((cache) => {
                cache.put(fetchRequest, cacheResponse);
            });
        });
        return response;
    }).catch((err) => {
        if (!url.match(/\.png$/)) {
            throw err;
        }
        return caches.match(BASE_URL + NO_IMAGE, { cacheName: CACHE_NAME }).then((data) => {
            console.log(data);
            return data;
        });
    }));
});
function DefaultURL(url) { return url.split('?')[0]; }
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
