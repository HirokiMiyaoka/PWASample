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

// Cache files.

const CACHE_NAME = 'chache_ver_' + VERSION;

const BASE_URL = location.href.replace( /\/[^\/]*$/, '' );
const BASE_PATH = location.pathname.replace( /\/.*$/, '' );
const CACHE_FILES =
[
	BASE_PATH + '/',
	BASE_PATH + '/index.html',
	BASE_PATH + '/app.js',
];

// Service worker

self.addEventListener( 'install', ( event: InstallEvent ) =>
{
	console.info( 'install', event );
	//event.waitUntil(self.skipWaiting());
	event.waitUntil( AddCacheFiles() );
} );

self.addEventListener( 'activate', ( event: ActivateEvent ) =>
{
	console.info( 'activate', event );
	event.waitUntil( RemoveOldCache() );
} );

self.addEventListener( 'sync', ( event ) =>
{
	console.info( 'sync', event );
} );

self.addEventListener( 'fetch', ( event: FetchEvent ) =>
{
	console.log( navigator.onLine );
	console.log( 'fetch', event );
	const url = DefaultURL( event.request.url );
	if ( CACHE_FILES.indexOf( url ) < 0 ) { return; }
	event.respondWith(
		caches.match( url, { cacheName: CACHE_NAME } ).catch( () => { return fetch( event.request ); } )
	);
	// chache -[exists]-> return cache
	//         `[not exists] -> fetch
	// more...
	// chache -[exists]-> return cache
	//         `[not exists] -> fetch -[OK]-> cache & return response
	//                                 `[NG]-> return error or return error response in cache(no image, ...)
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
			return fetch( new Request( url ) ).then( ( response ) =>
			{
				if ( response.ok ) { return cache.put( DefaultURL( response.url ), response ); }
				return Promise.reject( { error: 'Access error.', response: response } );
			} ).catch( ( err ) => { console.log(err); } );
		} ) );*/
	} );
}

function RemoveOldCache()
{
	return caches.keys().then( ( keys: string[] ) =>
	{
		return Promise.all( keys.map( ( cacheName ) =>
		{
			console.log( 'Remove cache:', cacheName );
			return cacheName !== CACHE_NAME ? caches.delete( cacheName ) : Promise.resolve( true );
		} ) );
	} );
}
