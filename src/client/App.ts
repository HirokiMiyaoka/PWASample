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
		navigator.serviceWorker.register( './sw.js', {scope: './'} );
		navigator.serviceWorker.ready.then( ( registration ) =>
		{
			console.log( 'Success registration:', registration );

			(<HTMLElement>document.getElementById( 'version' )).textContent = VERSION;

			this.initPush( registration );

			if ( !registration.active ) { return; }

			// Get Service Worker version.
			this.sendMessage( { type: 'version' } );
			navigator.serviceWorker.addEventListener( 'message', ( event ) =>
			{
				// Check Service Worker version & localStorage version.
				//const ver = registration.active.scriptURL.split( '?' )[ 1 ] || '_';
				const ver = <string>event.data || '';
				if ( VERSION === ver || VERSION === localStorage.getItem( 'VERSION' ) ) { /*registration.update();*/ return; }
				localStorage.setItem( 'VERSION', VERSION );

				// Update alert.
				alert( 'Success registration: ver' + VERSION );
			}, false );
		} ).catch( ( error ) => { console.log( error ); } );
	}

	private initPush( registration: ServiceWorkerRegistration )
	{
		registration.pushManager.subscribe( { userVisibleOnly: true } ).then( ( subscribed ) =>
		{
			console.log( 'subscribed:' , subscribed );

			// Get endpoint.
			const endpoint = subscribed.endpoint.replace( 'https://android.googleapis.com/gcm/send/', '' );
			if ( endpoint === subscribed.endpoint ) { return; }

			// Print endpoint.
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

	private sendMessage( msg: any ): Promise<MessageEvent>
	{
		// Send message to Service Worker.
		return new Promise( ( resolve, reject ) =>
		{
			const sw = (<ServiceWorkerContainer>navigator.serviceWorker).controller;
			if ( !sw ) { return; }

			const channel = new MessageChannel();
			channel.port1.addEventListener( 'message', ( event ) =>
			{
				if ( event.data.error)
				{
					reject( event );
				} else
				{
					resolve( event );
				}
			}, false );

			sw.postMessage( msg, [ channel.port2 ] );
		} );
	}
}
