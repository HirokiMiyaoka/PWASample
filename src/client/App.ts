class App
{
	private game: Game;
	constructor()
	{
		this.game = new Game( 'area' );
	}

	private initServiceWorker()
	{
		if ( !( 'serviceWorker' in navigator ) ) { return; }
		navigator.serviceWorker.register( './sw.js'/*, {scope: '/example'}*/ );
		navigator.serviceWorker.ready.then( ( registration ) =>
		{
			/*(<HTMLButtonElement>document.getElementById( 'button' )).addEventListener( 'click', () => {
				registration.sync.register( 'sync-test' ).then( () =>
				{
					console.log('sync registerd');
				} ).catch( ( error ) => { console.log( error ); } );
			}, false );*/
		} ).catch( ( error ) => { console.log( error ); } );
	}
}
