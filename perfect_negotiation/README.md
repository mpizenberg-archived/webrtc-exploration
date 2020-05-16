# Perfect Negociation

Perfect negociation is a pattern to handle perfectly
without glare (signaling collisions) changes in peer states.
With this pattern, we can simply call `pc.addTrack`
on one end and let it be perfectly handled on both ends.
A very useful blog post about perfect negociation is available at
https://blog.mozilla.org/webrtc/perfect-negotiation-in-webrtc/

The example is implemented in the WebRTC 1.0 updated spec:
https://w3c.github.io/webrtc-pc/#perfect-negotiation-example

That example is also detailed on MDN:
https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation

It seems however that the updated 1.0 API
(with new versions of `setLocalDescription`,
`setRemoteDescription` and `restartIce`)
is not implemented in Safari yet.

## API SignalingChannel

withRemote : String -> SignalingChannel
signalingChannel.onMessage( (msg) => { ... } );
signalingChannel.send(msg);

signalingChannel.sendDescription(localDescription);
signalingChannel.sendIceCandidate(iceCandidate);

signalingChannel.onRemoteDescription( (description) => { ... } );
signalingChannel.onRemoteIceCandidate( (iceCandidate) => { ... } );

## API PeerConnection

new : IceConfig -> SignalingChannel -> PeerConnection
peerConnection.setLocalStream(localStream); // does some pc.addTrack(...)
peerConnection.onRemoteTrack((stream) => { ... } );


## Setup and Run

```shell
# Install node packages and create a self signed certificate server.pem
npm install

# Start https server
npm start
```
