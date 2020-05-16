const https = require("https");
const fs = require("fs");
const express = require("express");
const WebSocket = require("ws");

const httpsPort = 8443;
const credentials = {
  key: fs.readFileSync("server.pem"),
  cert: fs.readFileSync("server.pem"),
};

const app = express();
app.use(express.static("public"));

const httpsServer = https.createServer(credentials, app);
const wss = new WebSocket.Server({ server: httpsServer });
const peersSocks = new Map();
const peersIds = new Map();
let idCount = 0;

wss.on("connection", (ws, req) => {
  console.log("Connection of " + req.connection.remoteAddress);
  ws.on("message", (jsonMsg) => {
    let msg = JSON.parse(jsonMsg);
    if (msg.msgType == "join") {
      console.log("join", idCount);
      // Greet each pair of peers on both sides.
      for (let [id, sock] of peersSocks) {
        ws.send(
          JSON.stringify({
            msgType: "greet",
            remotePeerId: id,
            polite: true,
          })
        );
        sock.send(
          JSON.stringify({
            msgType: "greet",
            remotePeerId: idCount,
            polite: false,
          })
        );
      }
      peersSocks.set(idCount, ws);
      peersIds.set(ws, idCount);
      idCount += 1;
    } else if (msg.msgType == "sessionDescription") {
      relay(ws, msg);
    } else if (msg.msgType == "iceCandidate") {
      relay(ws, msg);
    }
  });
});

function relay(ws, msg) {
  // Relay message to target peer.
  const target = peersSocks.get(msg.remotePeerId);
  if (target == undefined) return;
  const originId = peersIds.get(ws);
  if (originId == undefined) return;
  console.log("relay", msg.msgType, "from", originId, "to", msg.remotePeerId);
  target.send(
    JSON.stringify({
      msgType: msg.msgType,
      data: msg.data,
      remotePeerId: originId,
    })
  );
}

console.log("Listening at https://localhost:" + httpsPort);
httpsServer.listen(httpsPort);
