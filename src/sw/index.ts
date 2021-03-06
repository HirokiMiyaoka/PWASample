// Types

interface ExtendableEvent extends Event
{
	waitUntil( fn: Promise<any> ): void;
}

interface FetchEvent extends Event
{
	request: Request;
	respondWith(response: Promise<Response>|Response): Promise<Response>;
}

interface InstallEvent extends ExtendableEvent
{
	activeWorker: ServiceWorker
}

interface ActivateEvent extends ExtendableEvent
{
}

interface NotificationEvent extends ExtendableEvent
{
	action: string;
	notification: Notification;
}

interface PushMessageData
{
	arrayBuffer(): ArrayBuffer;
	blob(): Blob;
	json(): any;
	text(): string;
}

interface PushEvent extends ExtendableEvent
{
	data: PushMessageData;
}

type ClientFrameType = "auxiliary" | "top-level" | "nested" | "none";
type ClientMatchTypes = "window" | "worker" | "sharedworker" | "all";
type WindowClientState = "hidden" | "visible" | "prerender" | "unloaded";

interface ClientMatchOptions
{
	includeUncontrolled?: boolean;
	type?: ClientMatchTypes;
}

interface WindowClient
{
	focused: boolean;
	visibilityState: WindowClientState;
	focus(): Promise<WindowClient>;
	navigate(url: string): Promise<WindowClient>;
}

interface Client
{
	frameType: ClientFrameType;
	id: string;
	url: string;
	postMessage( message: any ): void;
}

interface Clients
{
	claim(): Promise<any>;
	get(id: string): Promise<Client>;
	matchAll(options?: ClientMatchOptions): Promise<Array<Client>>;
	openWindow(url: string): Promise<WindowClient>;
}

declare var clients: Clients;

// Cache files.

const CACHE_NAME = 'chache_ver_' + VERSION;

const BASE_URL = location.href.replace( /\/[^\/]*$/, '' );
const BASE_PATH = location.pathname.replace( /\/[^\/]*$/, '' );
const NO_IMAGE = '/noimg.png';
const CACHE_FILES =
[
	BASE_PATH + '/',
	BASE_PATH + '/index.html',
	BASE_PATH + '/app.js',
	BASE_PATH + '/img0.png',
	BASE_PATH + NO_IMAGE,
];

// Service Worker

self.addEventListener( 'install', ( event: InstallEvent ) =>
{
	console.info( 'install', event );

	const p =
	[
		AddCacheFiles(),           // Add chache in CACHE_FILES.
		(<any>self).skipWaiting(), // Update Service Worker now.
	];

	event.waitUntil( Promise.all( p ) );
} );

self.addEventListener( 'activate', ( event: ActivateEvent ) =>
{
	console.info( 'activate', event );

	// Remove old version cache.
	event.waitUntil( RemoveOldCache() );
} );

self.addEventListener( 'message', ( event: MessageEvent ) =>
{
	console.info( 'message', event );
	(<any>event).waitUntil( clients.matchAll().then( ( client ) =>
	{
		// Send message to client.
		if ( event.data.type === 'version' )
		{
			client[ 0 ].postMessage( VERSION );
		}
	} ) );
} );

self.addEventListener( 'sync', ( event ) =>
{
	console.info( 'sync', event );
} );

self.addEventListener('push', ( event: PushEvent ) =>
{
	console.log( 'push', event );
	event.waitUntil(
		(<any>self).registration.showNotification( 'Push Received',
		{
			body: 'Message',
			icon: './icon-144.png',
			tag: 'push-notification-tag',
		} )
	);
} );

self.addEventListener( 'notificationclick', ( event: NotificationEvent ) =>
{
	console.log( 'notificationclick', event );
	// Close notification popup.
	event.notification.close();

	// Start this app.
	event.waitUntil( clients.matchAll( { type: "window" } ).then( ( clientList ) =>
	{
		for ( let i = 0; i < clientList.length; ++i )
		{
			const client = clientList[ i ];
			if ( client.url == '/' && 'focus' in client ) { return (<any>client).focus(); }
		}
		if ( clients.openWindow ) { return clients.openWindow('./'); }
	} ) );
}, false);

self.addEventListener( 'fetch', ( event: FetchEvent ) =>
{
	// Fech hook.
	console.log( 'fetch', event );
	console.log( 'Online:', navigator.onLine );
	const url = DefaultURL( event.request.url );

	const fetchRequest = event.request.clone();
	return event.respondWith(
		fetch( event.request ).then( ( response ) =>
		{
			// Fetch file.
			if ( !response.ok ) { throw 'notfound'; }
			// Check cache.
			const cacheResponse = response.clone();
			caches.match( url, { cacheName: CACHE_NAME } ).then( ( response ) =>
			{
				if ( !response ) { return; }
				// Update cache.
				console.log( 'Cache hit:', response );
				caches.open( CACHE_NAME ).then( ( cache ) =>
				{
					cache.put( fetchRequest/*event.request*/, cacheResponse );
				} );
			} );
			return response;
		} ).catch( ( err ) =>
		{
			// Fetch error.
			if ( !url.match( /\.png$/ ) ) { throw err; }
			// Fetch error & Image file ... return No image.
			return caches.match( BASE_URL + NO_IMAGE, { cacheName: CACHE_NAME } ).then( (data)=>
			{
				console.log( 'Cache error:', data);
				return data;
			} );
		} )
	);
} );

function DefaultURL( url: string ){ return url.split( '?' )[ 0 ]; }

function AddCacheFiles()
{
	// location: WorkerLocation
	// Sample data { hash: "", host: "127.0.0.1:56979", hostname: "127.0.0.1",
	// href:"http://127.0.0.1:56979/sw.js?10", origin: "http://127.0.0.1:56979",
	// pathname: "/sw.js", port: "56979", protocol: "http:", search: "?10" }
	return caches.open( CACHE_NAME ).then( ( cache ) =>
	{
		return cache.addAll( CACHE_FILES ).catch( ( err ) => { console.log( 'error', err ); return; } );
		/*return Promise.all( CACHE_FILES.map( ( url ) =>
		{
			return fetch( new Request( BASE_URL + url ) ).then( ( response ) =>
			{
				if ( !response.ok ) { throw new TypeError('Bad response status'); }
				return cache.put( response.url, response );
			} ).catch( ( err ) => { console.log(err); } );
		} ) );*/
	} );
}

function RemoveOldCache()
{
	return caches.keys().then( ( keys: string[] ) =>
	{
		if ( keys.indexOf( CACHE_NAME ) < 0 ) { return Promise.resolve( false ); }
		return Promise.all( keys.map( ( cacheName ) =>
		{
			if ( cacheName !== CACHE_NAME ) { console.log( 'Remove cache:', cacheName ); }
			return cacheName !== CACHE_NAME ? caches.delete( cacheName ) : Promise.resolve( true );
		} ) );
	} );
}
