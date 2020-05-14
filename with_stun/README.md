# WebRTC with STUN

This features a very simple server for testing WebRTC with 2 peers.
The default STUN network of google is used to find a connection.
This is needed for example when my laptop is on the WiFi
and my phone on the mobile network.

```shell
# Install node packages and create a self signed certificate server.pem
npm install

# Start https server
npm start
```
