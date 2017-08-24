class App
{
	private game: Game;
	constructor()
	{
		this.initServiceWorker();
		this.reset();
	}

	public reset()
	{
		const parent = (<HTMLElement>document.getElementById( 'area' ));
		while( 0 < parent.children.length ) { parent.removeChild( parent.children[ 0 ] ); }

		this.game = new Game( this, 'area' );
	}

	private initServiceWorker()
	{
		if ( !( 'serviceWorker' in navigator ) ) { return; }
		navigator.serviceWorker.register( './sw.js?' + VERSION, {scope: './'} );
		navigator.serviceWorker.ready.then( ( registration ) =>
		{
			console.log( 'Success registration:', registration );
			if ( !registration.active ) { return; }
			alert( 'Success registration: ver' + VERSION );
			/*(<HTMLButtonElement>document.getElementById( 'button' )).addEventListener( 'click', () => {
				registration.sync.register( 'sync-test' ).then( () =>
				{
					console.log('sync registerd');
				} ).catch( ( error ) => { console.log( error ); } );
			}, false );*/
		} ).catch( ( error ) => { console.log( error ); } );
	}
}
