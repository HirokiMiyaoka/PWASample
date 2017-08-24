const COLOR_MAX = 4;

class Game
{
	private area: HTMLElement;
	private blocks: Blocks;
	private reset: () => any;

	constructor( app: App, area: string )
	{
		this.area = <HTMLElement>document.getElementById( area );
		this.blocks = new Blocks( this.area, 6, 6 );
		this.reset = () => { app.reset(); };

		this.checkOnline();

		const startButton = (<HTMLButtonElement>document.getElementById( 'start' ));
		if ( startButton )
		{
			startButton.addEventListener( 'click', () => { this.start(); }, false );
		} else
		{
			this.start();
		}
		const refreshButton = (<HTMLButtonElement>document.getElementById( 'refresh' ));
		if ( refreshButton ) { refreshButton.addEventListener( 'click', () => { this.refresh(); }, false ); }
	}

	public start()
	{
		this.blocks.start();
	}

	public refresh()
	{
		this.blocks.clearData();

		location.reload( this.checkOnline() );
		/*if ( this.checkOnline() )
		{
			location.reload( true );
		} else
		{
			this.reset();
		}*/
	}

	private checkOnline()
	{
		const online = navigator.onLine !== false;
		if ( online )
		{
			document.body.classList.remove( 'offline' );
		} else
		{
			document.body.classList.add( 'offline' );
		}
		return online;
	}
}

class Blocks
{
	private element: HTMLElement;
	private width: number;
	private height: number;
	private blocks: Block[];

	constructor( element: HTMLElement, width: number, height: number )
	{
		this.blocks = [];
		this.element = element;
		this.width = width;
		this.height = height;
		this.clean();
	}

	public clean()
	{
		this.blocks.forEach( ( block ) => { this.remove( block ); } );
		this.blocks = [];
		this.sort();
		const colors = this.load( this.width * this.height );
		for ( let y = 0 ; y < this.height ; ++y )
		{
			for ( let x = 0 ; x < this.width ; ++x )
			{
				const block = new Block( this, x, this.calcY( (y - this.height) * 2 ), colors[ y * this.width + x ] );
				this.blocks.push( block );
				this.add( block );
			}
		}
	}

	public start()
	{
		for ( let y = 0 ; y < this.height ; ++y )
		{
			for ( let x = 0 ; x < this.width ; ++x )
			{
				this.blocks[ y * this.width + x ].setY( y );
			}
		}
		this.sort();
	}

	private sort()
	{
		this.blocks = this.blocks.filter( ( b ) => { return !b.isDead(); } );
		this.blocks.sort( ( a, b ) =>
		{
			//if ( a.isDead() ) { return -1; }
			//if ( b.isDead() ) { return 1; }
			return ( a.getY() * this.width + a.getX() ) - ( b.getY() * this.width + b.getX() );
		} );
	}

	public add( block: Block ) { this.element.appendChild( block.getElement() ); }
	public remove( block: Block ) { this.element.removeChild( block.getElement() ); }

	public blockWidth() { return 'calc(100%/' + this.width + ')'; }
	public blockHeight() { return 'calc(100%/' + this.height + ')'; }
	public calcX( x: number ) { return 'calc(' + x + '*100%/' + this.width + ')'; }
	public calcY( y: number ) { return 'calc(' + y + '*100%/ ' + this.height + ')'; }

	public getBlock( x: number, y: number )
	{
		if ( x < 0 || this.width <= x || y < 0 || this.height <= y ) { return null; }
		for ( let i = 0 ; i < this.blocks.length ; ++i )
		{
			if ( this.blocks[ i ].existsPosition( x, y ) ) { return this.blocks[ i ]; }
		}
		return null;
	}

	public actionBlock( block: Block )
	{
		this.chainBlocks( block.getX(), block.getY(), block.getColor() );

		for ( let x = 0 ; x < this.width ; ++x )
		{
			let count = 0;
			for ( let y = this.height - 1 ; 0 <= y ; --y )
			{
				let block = this.getBlock( x, y );
				if ( block ) { continue; }

				for ( let y_ = y - 1 ; 0 <= y_ ; --y_ )
				{
					block = this.getBlock( x, y_ );
					if ( block ) { break; }
				}
				if ( !block )
				{
					block = new Block( this, x, this.calcY( (++count) * -2 ), -1 );
					this.blocks.push( block );
					this.add( block );
				}
				block.setY( y, 100 );
			}
		}

		this.save();
	}

	public chainBlocks( x: number, y: number, color: number )
	{
		const block = this.getBlock( x, y );
		if ( !block || block.isDead() || block.getColor() != color ) { return; }
		block.dead();
		this.chainBlocks( x + 1, y, color );
		this.chainBlocks( x - 1, y, color );
		this.chainBlocks( x, y + 1, color );
		this.chainBlocks( x, y - 1, color );
	}

	private save()
	{
		this.sort();
		if ( !window.localStorage ) { return; }
		window.localStorage.setItem( 'blocks', this.blocks.map( ( b ) => { return b.getColor(); } ).join( '' ) );
	}

	private load( length: number )
	{
		const colors = ( window.localStorage ? window.localStorage.getItem( 'blocks') || '' : '' ).split( '' ).map( ( v ) => { return parseInt( v ); } );
		while ( colors.length < length ){ colors.push( -1 ); }
		return colors;
	}

	public clearData()
	{
		if ( !window.localStorage ) { return; }
		window.localStorage.clear();
	}
}

class Block
{
	private element: HTMLElement;
	private parent: Blocks;
	private x: number;
	private y: number;
	private color: number;

	constructor( parent: Blocks, x: number, y: number | string, color: number )
	{
		this.x = this.y = -1;
		this.parent = parent;
		this.element = document.createElement( 'div' );
		this.setSize( parent.blockWidth(), parent.blockHeight() );
		this.setPosition( x, y );
		this.setColor( color < 0 ? Math.floor( Math.random() * COLOR_MAX ) : color );
		this.element.classList.add( 'block' );

		this.element.addEventListener( 'click', ( e ) => { this.action( e ); }, false );
	}

	private action( e: MouseEvent )
	{
		if ( this.isDead() ) { return; }
		this.parent.actionBlock( this );
	}

	public setSize( w: string, h: string )
	{
		this.element.style.width = w;
		this.element.style.height = h;
	}

	public setPosition( x: string | number, y: string | number )
	{
		this.setX( x );
		this.setY( y );
	}

	public existsPosition( x: number, y: number ) { return this.x === x && this.y === y; }

	public getElement() { return this.element; }

	public setX( x: string | number )
	{
		if ( typeof x === 'number' )
		{
			this.x = x;
			x = this.parent.calcX( x );
		}
		this.element.style.left = x;
	}

	public setY( y: string | number, lazy: number = 0 )
	{
		if ( typeof y === 'number' )
		{
			this.y = y;
			y = this.parent.calcY( y );
		}
		if ( lazy <= 0 )
		{
			this.element.style.top = y;
			return;
		}
		setTimeout( () => { this.element.style.top = <string>y; }, lazy );
	}

	public getX() { return this.x; }
	public getY() { return this.y; }
	public getColor() { return this.color; }

	public setColor( color: number )
	{
		this.color = color;
		this.element.classList.add( 'color' + color );
	}

	public isDead() { return this.x < 0 || this.y < 0; }

	public dead()
	{
		this.x = this.y = -1;
		this.parent.remove( this );
		//setTimeout( () => {  }, 1000 );
	}
}
