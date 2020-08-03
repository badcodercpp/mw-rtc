var express = require('express');
var app = express();
var fs = require('fs');
var options = {
  key: fs.readFileSync('./fake-keys/privatekey.pem'),
  cert: fs.readFileSync('./fake-keys/certificate.pem')
};
var serverPort = (process.env.PORT  || 4443);
var https = require('https');
var http = require('http');
var _noop = require('lodash/noop');
var _isEmpty = require('lodash/isEmpty');
var server;
if (process.env.LOCAL) {
  server = https.createServer(options, app);
} else {
  server = http.createServer(app);
}
var io = require('socket.io')(server);

var roomList = {};

app.get('/', function(req, res){
  console.log('get /');
  res.sendFile(__dirname + '/index.html');
});
server.listen(serverPort, function(){
  console.log('server up and running at %s port', serverPort);
  // if (process.env.LOCAL) {
  //   open('https://localhost:' + serverPort)
  // }
});

function socketIdsInRoom(name) {
  var socketIds = io.nsps['/'].adapter.rooms[name];
  if (socketIds) {
    var collection = [];
    for (var key in socketIds) {
      collection.push(key);
    }
    return collection;
  } else {
    return [];
  }
}

const users = {

}

io.on('connection', function(socket){
  console.log("connected")
  socket.on('preserveSocketId', (data, callback = _noop) => {
    console.log("dada", data)
    const j = JSON.parse(data);
    const {kind} = j;
    users[kind] = socket.id;
    callback(socket.id);
  })
  // console.log('connection');
  socket.on('disconnect', function(){
    const kind = socket.id;
    const target = users[kind];
    if (!_isEmpty(target)) {
      delete users[kind];
    }
  });

  socket.on('join', function(name, callback = _noop){
      console.log('join', name);
      var socketIds = socketIdsInRoom(name);
      callback(socketIds);
      socket.join(name);
      socket.room = name;
  });

  socket.on('ringUser', (data = {}) => {
    console.log("ringUser", data, users, "hi")
    const {to, room} = data;
    const target = users[to];
    if (!_isEmpty(target)) {
      io.to(target).emit('ringBack', {room})
    }
  });

  socket.on('exchange', function(data){
    //   console.log('exchange', data);
      data.from = socket.id;
      var to = io.sockets.connected[data.to];
      to.emit('exchange', data);
  });

  // socket.on('startCall', (data) => {
  //   const j = JSON.stringify(data);
  //   const {to} = j;
  // })

  // socket.on('')

  // socket.on('join', function(name, callback = _noop){
  //   console.log('join', name);
  //   var socketIds = socketIdsInRoom(name);
  //   callback(socketIds);
  //   socket.join(name);
  //   socket.room = name;
  // });


  // socket.on('exchange', function(data){
  //   console.log('exchange', data);
  //   data.from = socket.id;
  //   var to = io.sockets.connected[data.to];
  //   to.emit('exchange', data);
  // });
});
