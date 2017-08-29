const WebSocket = require('ws')
const server = new WebSocket.Server({ port: 9090 })
server.on( 'connection', (ws) => {
	ws.on( 'message', (data) => {
		ws.send( data )
	})
})
