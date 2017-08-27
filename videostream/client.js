function putStream( stream ) {
	const video = document.getElementById( 'videotag' )
	video.srcObject = stream
}

function logError( err ) {
	console.log( err.name + ": " + err.message )
}

const config = { video: { width: 320, height: 240 }, audio: true }
navigator.mediaDevices.getUserMedia( config )
.then( putStream )
.catch( logError )
