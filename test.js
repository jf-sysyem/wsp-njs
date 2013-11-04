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
    // Abilito il listener della chat
    test_port = ephp.readParam(data, 'port:', test_port);
    server.listen(test_port);
    console.log('Test service enabled on port ' + test_port);
});

// routing di express ??
app.get('/', function(req, res) {
    res.sendfile(__dirname + '/example.html');
});

// username degli utenti che sono in chat
var enter = exit = n = 0;

setInterval(function(){
    if(n > 1024*1024) n = 0;
    io.sockets.emit('counter', enter, exit, n++);
}, 10000);

io.sockets.on('connection', function(socket) {

    /**
     * emits 'adduser'
     * 
     * Aggiunge un utente in chat e lo fa entrare nella stanza default
     * @var username string username adottato in chat
     */
    socket.on('enter', function(user) {
        // memorizzo l'username nella sessione del socket associata al client
        socket.user = user;
        enter++;
        socket.emit('private_msg', 'Ciao ' + socket.user);
        io.sockets.emit('public_msg', socket.user+' è entrato', socket.user);
    });
    
    /**
     * emits 'adduser'
     * 
     * Aggiunge un utente in chat e lo fa entrare nella stanza default
     * @var username string username adottato in chat
     */
    socket.on('exit', function(user) {
        // memorizzo l'username nella sessione del socket associata al client
        exit++;
        socket.emit('private_msg', 'Arrivederci ' + socket.user);
        io.sockets.emit('public_msg', socket.user+' è uscito', socket.user);
    });

});
