// Retrieve video and button tags from dom
const local_video = document.getElementById( "local-video" )
const remote_video = document.getElementById( "remote-video" )
const join_button = document.getElementById( "join-button" )
const leave_button = document.getElementById( "leave-button" )


// Set callback functions for when the buttons are clicked
join_button.onclick = joinCall
leave_button.onclick = leaveCall


// Other global variables
let local_stream
let sent_stream
let pc
let socket


// Configuration
const stream_config = { audio: true, video: { width: 320, height: 240 } }
const socket_address = "ws://" + window.location.hostname + ":9090"


// INIT ##############################################################


// Disable buttons for now
join_button.disabled = true
leave_button.disabled = true


// Activate local camera stream
navigator.mediaDevices.getUserMedia( stream_config )
	.then( visualizeLocalStream )
	.then( () => { join_button.disabled = false } )


function visualizeLocalStream( stream ) {
	local_stream = stream
	local_video.srcObject = local_stream
}


// JOIN ##############################################################


function joinCall() {
	join_button.disabled = true
	leave_button.disabled = false
	initWebSocket()
}


function initWebSocket() {
	socket = new WebSocket( socket_address )
	socket.addEventListener( 'open', () => { initPeerConnection(); createOffer() } )
	socket.addEventListener( 'message', event => socketMessage( event.data ) )
}


function initPeerConnection() {
	pc = new RTCPeerConnection()
	pc.onicecandidate = (event) => sendOn( socket, "ice-candidate", event.candidate )
	pc.ontrack = (event) => { remote_video.srcObject = event.streams[0] }
	sent_stream = new MediaStream()
	local_stream.getTracks()
		.forEach( (track) => pc.addTrack( track, sent_stream ) )
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


// LEAVE #############################################################


function leaveCall() {
	join_button.disabled = false
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
