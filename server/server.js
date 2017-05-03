const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');
const bodyParser = require('body-parser');

const router = require('./routes');
const publicPath = path.join(__dirname, '../public');

const app = express();
const port = process.env.PORT || 5000;
const ip = process.env.IP || '192.168.1.13';
const server = http.createServer(app, ip);
const io = socketIO(server);

app.use(bodyParser.json());
app.use(router);

app.use(express.static(publicPath));

io.on('connection', (socket) => {
  console.log('new user connected');
})

server.listen(port, () => {
  console.log(`Started at port ${port}`);
});