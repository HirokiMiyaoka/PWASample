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

const CHACHE_NAME = 'chache_ver_' + VERSION;

const CACHE_FILES =
[
	'index.html',
	'app.js',
];

// Service worker

self.addEventListener( 'install', ( event: InstallEvent ) =>
{
	console.info( 'install', event );
	//event.waitUntil(self.skipWaiting());
	event.waitUntil( CacheFiles() );
} );

self.addEventListener( 'activate', ( event: ActivateEvent ) =>
{
	console.info( 'activate', event );
} );

self.addEventListener( 'sync', ( event ) =>
{
	console.info( 'sync', event );
} );

self.addEventListener( 'fetch', ( event: FetchEvent ) =>
{
	console.log( navigator.onLine );
	console.log( 'fetch', event );
} );

function CacheFiles()
{
console.log(location);
	return caches.open( CHACHE_NAME ).then( ( cache ) =>
	{
		const baseurl = location.href.replace( /\/[^\/]*$/, '/' );
		return Promise.all( CACHE_FILES.map( ( filename ) =>
		{
			const url = baseurl + filename;
console.log( url, filename );
			return fetch( new Request( url ) ).then( ( response ) =>
			{
				if ( response.ok ) { return cache.put( response.url, response ); }
				return Promise.reject( { error: 'Access error.', response: response } );
			} ).catch( (err)=>{console.log(err);} );
		} ) );
	} );
}