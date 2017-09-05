// Retrieve text and button tags from DOM
const conversation_tag = document.getElementById( "conversation" )
const form_tag = document.getElementById( "message-form" )
const message_tag = document.getElementById( "message" )
const join_button = document.getElementById( "join-button" )
const send_button = document.getElementById( "send-button" )
const leave_button = document.getElementById( "leave-button" )


// Set callback functions for when the buttons are clicked
form_tag.onsubmit = sendMessage
join_button.onclick = joinCall
send_button.onclick = sendMessage
leave_button.onclick = leaveCall


// Other global variables
let local_stream
let pc
let socket
let send_channel


// Configuration
const socket_address = "wss://" + window.location.host


// Disable buttons for now
join_button.disabled = false
send_button.disabled = true
leave_button.disabled = true


// JOIN ##############################################################


function joinCall() {
	join_button.disabled = true
	leave_button.disabled = false
	message_tag.focus()
	initWebSocket()
}


function initWebSocket() {
	socket = new WebSocket( socket_address )
	socket.addEventListener( 'open', () => { initPeerConnection(); createOffer() } )
	socket.addEventListener( 'message', event => socketMessage( event.data ) )
}


function initPeerConnection() {
	pc = new RTCPeerConnection()
	send_channel = pc.createDataChannel('sendDataChannel')
	pc.onicecandidate = (event) => sendOn( socket, "ice-candidate", event.candidate )
	pc.ondatachannel = (event) => {
		channel = event.channel
		channel.onmessage = (event) => writeConv( "Remote", event.data )
		channel.onopen = () => { send_button.disabled = false }
		channel.onclose = () => {}
	}
}


function createOffer() {
	pc.createOffer()
		.then( sendOffer )
		.catch( logError )
}


function sendOffer( sdp ) {
	pc.setLocalDescription( sdp )
	sendOn( socket, "offer", sdp )
}


function receiveOffer( sdp ) {
	initPeerConnection()
	pc.setRemoteDescription( sdp )
		.then( () => pc.createAnswer() )
		.then( (answer_sdp) => {
			pc.setLocalDescription( answer_sdp )
			sendOn( socket, "answer", answer_sdp )
		}).catch( logError )
}


// SEND ##############################################################


function sendMessage() {
	writeConv( "Local", message_tag.value )
	send_channel.send( message_tag.value )
	message_tag.value = ""
	message_tag.focus()
}


function writeConv( user, message ) {
	text_node = document.createTextNode( user + ": " + message )
	conversation_tag.appendChild( text_node )
	conversation_tag.appendChild( document.createElement("br") )
}


// LEAVE #############################################################


function leaveCall() {
	join_button.disabled = false
	send_button.disabled = true
	leave_button.disabled = true
	pc.close()
	pc = null
	socket.close()
}


// SOCKET ############################################################


function sendOn( socket, datatype, data ) {
	socket.send( JSON.stringify( { datatype: datatype, data: data } ) )
}


function socketMessage( event_data ) {
	const data = JSON.parse( event_data )
	if ( data.datatype == "ice-candidate" )
		pc.addIceCandidate( data.data )
	else if ( data.datatype == "offer" )
		receiveOffer( data.data )
	else if ( data.datatype == "answer" )
		pc.setRemoteDescription( data.data )
}


// UTILS #############################################################


function logError( err ) { console.log( err.name + ": " + err.message ) }
