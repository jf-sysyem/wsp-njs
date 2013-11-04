var express = require('express')
        , app = express()
        , server = require('http').createServer(app)
        , io = require('socket.io').listen(server)
        , sugar = require('./ephp_modules/node_modules/sugar')
        , fs = require('fs')
        , ephp = require('./ephp_modules/utility')
        ;

var test_port = 0;

var config = 'test';

process.argv.forEach(function(val, index, array) {
    if (index === 2) {
        config = val;
    }
});

fs.readFile('./' + config + '.yml', 'utf8', function(err, data) {
    if (err) {
        return console.log(err);
    }
    test_port = ephp.readParam(data, 'port:', test_port);
    server.listen(test_port);
    console.log('Test service enabled on port ' + test_port);
});

app.get('/', function(req, res) {
    res.sendfile(__dirname + '/example.html');
});

var enter = exit = n = 0;

setInterval(function(){
    if(n > 1024) n = 0;
    io.sockets.emit('counter', enter, exit, n++);
}, 10000);

io.sockets.on('connection', function(socket) {

    socket.on('enter', function(user) {
        socket.user = user;
        enter++;
        socket.emit('private_msg', 'Ciao ' + socket.user);
        io.sockets.emit('public_msg', socket.user+' è entrato', socket.user);
    });
    
    socket.on('exit', function(user) {
        exit++;
        socket.emit('private_msg', 'Arrivederci ' + socket.user);
        io.sockets.emit('public_msg', socket.user+' è uscito', socket.user);
    });

});
