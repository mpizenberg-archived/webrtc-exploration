const WebSocket = require("ws")
const server = new WebSocket.Server({ port: 9090 })

server.on( "connection", (ws, req) => {
	console.log( "Connection of " + req.connection.remoteAddress )
	ws.on( "message", (data) => broadcast( ws, data ) )
	ws.on( "close", () => { server.clients.delete( ws ) } )
})

function broadcast( socket, data ) {
	// console.log( "Broadcast from " + socket.toString() )
	server.clients.forEach(
		(client) => { if (client !== socket) { client.send( data ) } }
	)
}
