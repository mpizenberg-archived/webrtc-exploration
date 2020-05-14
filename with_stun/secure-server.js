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

wss.on("connection", (ws, req) => {
  console.log("Connection of " + req.connection.remoteAddress);
  ws.on("message", (data) => broadcast(ws, data));
  ws.on("close", () => {
    wss.clients.delete(ws);
  });
});

function broadcast(ws, data) {
  wss.clients.forEach((client) => {
    if (client !== ws) {
      client.send(data);
    }
  });
}

console.log("Listening at https://localhost:" + httpsPort);
httpsServer.listen(httpsPort);
