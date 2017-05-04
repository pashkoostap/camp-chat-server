const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');
const bodyParser = require('body-parser');
const socketioJwt = require('socketio-jwt')

const router = require('./routes');
const publicPath = path.join(__dirname, '../public');
const mongoConnected = require('./db.js');
const CONFIG = require('./config.json');

const app = express();
const ip = process.env.IP || '192.168.1.13';
const port = process.env.PORT || 5000;
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
        msg: msg.text,
        chat: msg.chat,
        user: socket.decoded_token,
        time: Date.now()
      }

      mongoConnected.then(db => {
        db.collection('messages').insert(msgObj, (err, doc) => {
          let message = doc.ops[0];
          io.to(message.chat).emit('message', message);
        })
      })
    });

    socket.on('join-room', (room) => {
      socket.join(room)
      console.log(room);
    })
  });

server.listen(port, () => {
  console.log(`Started at port ${port}`);
});