const http = require('http');
const express = require('express');
const socketIO = require('socket.io');
const bodyParser = require('body-parser');

const router = require('./routes');

const app = express();
const port = process.env.PORT || 5000;
const server = http.createServer(app);
const io = socketIO(server);

app.use(bodyParser.json());
app.use(router);

// io.on('connection', (socket) => {
//   console.log(socket);
// })

server.listen(port, () => {
  console.log(`Started at port ${port}`);
});