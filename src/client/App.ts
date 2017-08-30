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
			this.initPush( registration );
			if ( !registration.active ) { return; }
			const ver = registration.active.scriptURL.split( '?' )[ 1 ] || '_';
			if ( VERSION === ver ) { return; }
			alert( 'Success registration: ver' + VERSION );
			/*(<HTMLButtonElement>document.getElementById( 'button' )).addEventListener( 'click', () => {
				registration.sync.register( 'sync-test' ).then( () =>
				{
					console.log('sync registerd');
				} ).catch( ( error ) => { console.log( error ); } );
			}, false );*/
		} ).catch( ( error ) => { console.log( error ); } );
	}

	private initPush( registration: ServiceWorkerRegistration )
	{
		registration.pushManager.subscribe( { userVisibleOnly: true } ).then( ( subscribed ) =>
		{
			console.log( 'subscribed:' , subscribed );
			const endpoint = subscribed.endpoint.replace( 'https://android.googleapis.com/gcm/send/', '' );
			if ( endpoint === subscribed.endpoint ) { return; }
			const input = (<HTMLInputElement>document.getElementById( 'endpoint' ));
			input.value = endpoint;
			input.addEventListener( 'click', () => { this.copyText(); }, false );
		} );
	}

	private copyText()
	{
		const obj = (<HTMLInputElement>document.getElementById( 'endpoint' ));
		obj.select();
		document.execCommand( 'copy' );
	}
}
