// Retrieve tags from DOM
const file_input = document.getElementById( "file-input" )
const send_button = document.getElementById( "send-button" )
const send_progress = document.getElementById( "send-progress" )
const receive_progress = document.getElementById( "receive-progress" )
const download_tag = document.getElementById( "download" )


// Set callback functions for when the buttons are clicked
file_input.onchange = prepareToSend
file_input.disabled = true
send_button.onclick = sendFile
send_button.disabled = true


// Other global variables
let local_stream
let pc
let socket
let send_channel
let receive_channel
let transmission = {
	received_size: 0,
	received_buffer: [],
	file_name: "",
	file_size: 0,
	file_to_send: null
}


// Configuration
const socket_address = "wss://" + window.location.host
const chunk_size = 16384


// INIT ##############################################################


initWebSocket()


function initWebSocket() {
	socket = new WebSocket( socket_address )
	socket.addEventListener( 'open', () => { initPeerConnection(); createOffer() } )
	socket.addEventListener( 'message', event => socketMessage( event.data ) )
}


function initPeerConnection() {
	pc = new RTCPeerConnection()
	send_channel = pc.createDataChannel('sendDataChannel')
	send_channel.binaryType = "arraybuffer"
	send_channel.onopen = () => { file_input.disabled = false }
	pc.onicecandidate = (event) => sendOn( socket, "ice-candidate", event.candidate )
	pc.ondatachannel = (event) => {
		if (event.channel !== send_channel) {
			receive_channel = event.channel
			receive_channel.binaryType = "arraybuffer"
			receive_channel.onmessage = receiveData
			receive_channel.onopen = initReception
			receive_channel.onclose = () => {}
		}
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


function prepareToSend() {
	const file = file_input.files[0]
	if ( file != null && file.size != 0 ) {
		console.log( "File: " + [file.name, file.size, file.type].join(' ') )
		send_progress.max = file.size
		sendOn( socket, "file", {
			file_size: file.size,
			file_name: file.name
		})
		transmission.file_to_send = file
	}
}



function sendFile() {
	recursiveSendSlice( transmission.file_to_send, 0 )
}


function recursiveSendSlice( file, offset ) {
	if ( offset < file.size ) {
		const reader = new window.FileReader()
		reader.onload = (event) => {
			const buffer = event.target.result
			send_channel.send( buffer )
			send_progress.value = offset + buffer.byteLength
			window.setTimeout( recursiveSendSlice, 0, file, offset + chunk_size )
		}
		reader.readAsArrayBuffer( file.slice( offset, offset + chunk_size ) )
	}
}


// RECEIVE ###########################################################


function initReception(event) {
	transmission.received_size = 0
	transmission.received_buffer = []
	download_tag.textContent = ""
	download_tag.removeAttribute( 'download' )
	if (download_tag.href != null) {
		URL.revokeObjectURL( download_tag.href )
		download_tag.removeAttribute( 'href' )
	}
}

function receiveData(event) {
	const chunk = event.data
	transmission.received_buffer.push( chunk )
	transmission.received_size += chunk.byteLength
	receive_progress.value = transmission.received_size
	if (transmission.received_size >= transmission.file_size) {
		const file = new window.Blob( transmission.received_buffer )
		transmission.received_buffer = []
		download_tag.href = URL.createObjectURL( file )
		download_tag.download = transmission.file_name
		download_tag.textContent = transmission.file_name
	}
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
	else if ( data.datatype == "file" ) {
		transmission.file_name = data.data.file_name
		transmission.file_size = data.data.file_size
		receive_progress.max = transmission.file_size
		receive_progress.value = 0
		transmission.received_size = 0
		transmission.received_buffer = []
		sendOn( socket, "ready", {} )
	}
	else if ( data.datatype == "ready" )
		send_button.disabled = false
}


// UTILS #############################################################


function logError( err ) { console.log( err.name + ": " + err.message ) }
