import * as https from 'https'

const AUTH_KEY = process.env.PUSH_AUTH_KEY || 'YOUR_AUTH_KEY';
const REQUEST: https.RequestOptions =
{
	hostname: 'fcm.googleapis.com',
	port: 443,
	path: '/fcm/send',
	method: 'POST',
	headers:
	{
		'Content-Type': 'application/json',
		'Authorization': 'key=' + AUTH_KEY,
	},
};

const endpoint = process.argv[ 2 ] || '';

if ( !endpoint )
{
	console.log( 'npm run push -- ENDPOINT' );
	process.exit( 0 );
}

console.log( 'Push:', AUTH_KEY );
console.log( 'Endpoint:', endpoint );

const post = JSON.stringify( { to: endpoint } );

const req = https.request( REQUEST, ( response ) =>
{
	response.on( 'data', ( chunk ) =>
	{
		console.log( 'Success:' );
		console.log( chunk.toString() );
	} ).on( 'error', ( error ) =>
	{
		console.log( 'Error:' );
		console.log( error );
	} );
} );
req.write( post );
req.end();
