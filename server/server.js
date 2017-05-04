const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');
const bodyParser = require('body-parser');
const socketioJwt = require('socketio-jwt')

const router = require('./routes');
const publicPath = path.join(__dirname, '../public');

const app = express();
const port = process.env.PORT || 5000;
const ip = process.env.IP || '192.168.1.13';
const CONFIG = require('./config.json');
const server = http.createServer(app, ip);
const io = socketIO(server);

app.use(bodyParser.json());
app.use(router);

app.use(express.static(publicPath));

io.sockets
  .on('connection', socketioJwt.authorize({
    secret: CONFIG.SECRET,
    callback: false
  }))
  .on('authenticated', socket => {
    io.emit('join', {
      user: socket.decoded_token,
      time: Date.now()
    });
    socket.on('message', msg => {
      const msgObj = {
        msg,
        user: socket.decoded_token,
        time: Date.now()
      }

      io.emit('message', msgObj)
    });
  });

server.listen(port, () => {
  console.log(`Started at port ${port}`);
});