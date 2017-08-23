self.addEventListener( 'install', ( event ) =>
{
	console.info( 'install', event );
	//event.waitUntil(self.skipWaiting());
} );

self.addEventListener( 'activate', ( event ) =>
{
	console.info( 'activate', event );
} );

self.addEventListener('sync', (event) =>
{
	console.info( 'sync', event );
} );
