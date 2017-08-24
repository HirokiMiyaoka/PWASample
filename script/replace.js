const path = require( 'path' );
const fs = require( 'fs' );

let SUFFIX = '?0';

const files =
[
	'index.html',
	'manifest.json',
];

function Replace( file )
{
	return new Promise( ( resolve, reject ) =>
	{
		const filepath = path.join( './docs/', file );

		fs.readFile( filepath, 'utf8', ( err, data ) =>
		{
			if (err) { return reject( { error: err, file: filepath } ); }
			const result = data.replace( /\?[0-9]+/g, SUFFIX );

			fs.writeFile( filepath, result, 'utf8', ( err ) =>
			{
				if (err) { return reject( { error: err, file: filepath } ); }
			} );
			resolve( { msg: 'OK', file: filepath } );
		} );
	} );
}

fs.readFile( './src/var.ts', 'utf8', ( err, data ) =>
{
	if ( !err )
	{
		const ver = data.replace( /[\s\S]*VERSION\s*\=[^0-9]+([0-9]+)[\s\S]*/, '$1' );
		if ( !( ver.match( /[^0-9]/ ) ) ) { SUFFIX = '?' + ver; }
	}
	Promise.all( files.map( Replace ) ).then( () =>
	{
		console.log( 'Complete:', SUFFIX.substr( 1 ) );
	} ).catch( ( error ) =>
	{
		console.log( error );
	} );
} );
