// INIT ##############################################################


// Retrieve video and button tags from dom
const local_video_1 = document.getElementById( 'local-video-1' )
const remote_video_1 = document.getElementById( 'remote-video-1' )
const local_video_2 = document.getElementById( 'local-video-2' )
const remote_video_2 = document.getElementById( 'remote-video-2' )
const start_button = document.getElementById( 'start-button' )
const call_button = document.getElementById( 'call-button' )
const hangup_button = document.getElementById( 'hangup-button' )


// Deactivate call and hangup buttons for now
call_button.disabled = true
hangup_button.disabled = true


// Set callback functions for when the buttons are clicked
start_button.onclick = start
call_button.onclick = callRemote
hangup_button.onclick = hangupCall


// global variables
let stream_1
let stream_2 // would not exist if there was a real second device
let sent_stream_1
let sent_stream_2
let pc_1
let pc_2 // would not exist if there was a real second device
let socket


// Set configuration
const stream_config = { audio: true, video: { width: 320, height: 240 } }
const socket_address = 'ws://localhost:9090'


// START #############################################################


function start() {
	start_button.disabled = true
	call_button.disabled = false
	navigator.mediaDevices.getUserMedia( stream_config )
		.then( viewLocalStream )
		.then( createRemoteStream )
		.then( initWebSocket )
		.then( initLocalPeerConnection )
		.then( initRemotePeerConnection )
		.catch( logError )
}


function viewLocalStream( stream ) {
	stream_1 = stream
	local_video_1.srcObject = stream
	sent_stream_1 = new MediaStream()
}


function createRemoteStream() {
	local_video_2.oncanplay = () => { stream_2 = local_video_2.mozCaptureStream() }
	local_video_2.src = "http://techslides.com/demos/sample-videos/small.webm"
}


function initWebSocket() {
	socket = new WebSocket( socket_address )
	socket.addEventListener( 'open', () => console.log( 'socket opened' ) )
	socket.addEventListener( 'message', event => socketMessage( event.data ) )
}


function initLocalPeerConnection() {
	pc_1 = new RTCPeerConnection()
	pc_1.onicecandidate = (event) => sendOn( socket, "local-candidate", event.candidate )
	pc_1.ontrack = (event) => { remote_video_1.srcObject = event.streams[0] }
}


function initRemotePeerConnection() {
	pc_2 = new RTCPeerConnection()
	pc_2.onicecandidate = (event) => sendOn( socket, "remote-candidate", event.candidate )
	pc_2.ontrack = (event) => { remote_video_2.srcObject = event.streams[0] }
}


function receiveLocalCandidate( candidate ) {
	pc_2.addIceCandidate( candidate )
}


function receiveRemoteCandidate( candidate ) {
	pc_1.addIceCandidate( candidate )
}


// CALL ##############################################################


function callRemote() {
	call_button.disabled = true
	hangup_button.disabled = false
	stream_1.getTracks()
		.forEach( (track) => pc_1.addTrack( track, sent_stream_1 ) )
	pc_1.createOffer()
		.then( sendOfferDescription )
		.catch( logError )
}


function sendOfferDescription( description ) {
	pc_1.setLocalDescription( description )
	sendOn( socket, "offer-description", description )
}


function receiveOfferDescription( description ) {
	pc_2.setRemoteDescription( description )
	sent_stream_2 = new MediaStream()
	stream_2.getTracks()
		.forEach( (track) => pc_2.addTrack( track, sent_stream_2 ) )
	pc_2.createAnswer()
		.then( (answer_description) => {
			pc_2.setLocalDescription( answer_description )
			sendOn( socket, "answer-description", answer_description )
		}).catch( logError )
}


function receiveAnswerDescription( description ) {
	pc_1.setRemoteDescription( description )
}


// HANG UP ###########################################################


function hangupCall() {
	pc_1.close()
	pc_2.close()
	start_button.disabled = false
	call_button.disabled = true
	hangup_button.disabled = true
}


// SOCKET ############################################################


function socketMessage( event_data ) {
	const data = JSON.parse( event_data )
	if ( data.datatype == "local-candidate" )
		receiveLocalCandidate( data.data )
	else if ( data.datatype == "remote-candidate" )
		receiveRemoteCandidate( data.data )
	else if ( data.datatype == "offer-description" )
		receiveOfferDescription( data.data )
	else if ( data.datatype == "answer-description" )
		receiveAnswerDescription( data.data )
}


// UTILS #############################################################


function sendOn( socket, datatype, data ) {
	socket.send( JSON.stringify( { datatype: datatype, data: data } ) )
}


function logError( err ) { console.log( err.name + ": " + err.message ) }
