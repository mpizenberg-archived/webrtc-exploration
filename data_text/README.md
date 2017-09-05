# Local Area Network (lan) Secure WebRTC

This features a very simple server for testing WebRTC
with 2 peers on your local area network.

No STUN or TURN server is implemented here so this is why
it will only work with two machines on the same network.

```shell
# Install node packages and create a self signed certificate server.pem
npm install

# Start https server
npm start
```
