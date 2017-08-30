const https = require( 'https' )
const fs = require( 'fs' )
const express = require( 'express' )
const app = express()
const WebSocket = require( 'ws' )

const httpsPort = 8443
const credentials = {
	key: fs.readFileSync( 'server.pem' ),
	cert: fs.readFileSync( 'server.pem' )
}

app.use( express.static('.') )

const httpsServer = https.createServer( credentials, app )
const wsServer = new WebSocket.Server({ server: httpsServer })

wsServer.on( "connection", (ws, req) => {
	console.log( "Connection of " + req.connection.remoteAddress )
	ws.on( "message", (data) => broadcast( ws, data ) )
	ws.on( "close", () => { wsServer.clients.delete( ws ) } )
})

function broadcast( ws, data ) {
	wsServer.clients.forEach(
		(client) => { if (client !== ws) { client.send( data ) } }
	)
}

console.log( "Listening at https://localhost:" + httpsPort )
httpsServer.listen( httpsPort )
