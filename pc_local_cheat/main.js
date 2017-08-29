// INIT ##############################################################


// Retrieve video and button tags from dom
const local_video = document.getElementById( 'local-video' )
const remote_video = document.getElementById( 'remote-video' )
const start_button = document.getElementById( 'start-button' )
const call_button = document.getElementById( 'call-button' )
const hangup_button = document.getElementById( 'hangup-button' )


// Deactivate call and hangup buttons for now
call_button.disabled = true
hangup_button.disabled = true


// Set callback functions for when the buttons are clicked
start_button.onclick = startLocalVideo
call_button.onclick = callRemote
hangup_button.onclick = hangupCall


// global variables
let local_stream
let pc1
let pc2


// Set configuration
const stream_config = { audio: true, video: { width: 320, height: 240 } }
const offer_options = { offerToReceiveAudio: 1, offerToReceiveVideo: 1 }


// START #############################################################


function startLocalVideo() {
	start_button.disabled = true
	navigator.mediaDevices.getUserMedia( stream_config )
		.then( putLocalStream )
		.catch( logError )
}


function putLocalStream( stream ) {
	local_stream = stream
	local_video.srcObject = stream
	call_button.disabled = false
}


// CALL ##############################################################


function callRemote() {
	call_button.disabled = true
	hangup_button.disabled = false
	pc1 = new RTCPeerConnection()
	pc2 = new RTCPeerConnection()
	pc1.onicecandidate = (event) => { pc2.addIceCandidate( event.candidate ) }
	pc2.onicecandidate = (event) => { pc1.addIceCandidate( event.candidate ) }
	pc2.ontrack = (event) => { remote_video.srcObject = event.streams[0] }
	local_stream.getTracks()
		.forEach( (track) => pc1.addTrack( track, local_stream ) )
	pc1.createOffer( offer_options )
		.then( onCreateOfferSuccess )
		.catch( logError )
}


function onCreateOfferSuccess( description ) {
	pc1.setLocalDescription( description )
		.catch( logError )
	pc2.setRemoteDescription( description )
		.catch( logError )
	pc2.createAnswer()
		.then( onCreateAnswerSuccess )
		.catch( logError )
}


function onCreateAnswerSuccess( description ) {
	pc2.setLocalDescription( description )
		.catch( logError )
	pc1.setRemoteDescription( description )
		.catch( logError )
}


// HANG UP ###########################################################


function hangupCall() {
	pc1.close()
	pc2.close()
	hangup_button.disabled = true
	call_button.disabled = false
}


// UTILS #############################################################


function logError( err ) { console.log( err.name + ": " + err.message ) }
