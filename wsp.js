var express = require('express')
        , app = express()
        , server = require('http').createServer(app)
        , io = require('socket.io').listen(server)
        , sugar = require('./ephp_modules/node_modules/sugar')
        , fs = require('fs')
        , ephp = require('./ephp_modules/utility')
        , mysql = require('mysql')
        , $ = require('nodeQuery')
        ;

var wsp_port = 0;
var server_number = 0;
var http_wsp = '';
var database_host = '';
var database_port = 0;
var database_name = '';
var database_user = '';
var database_password = null;
var db_pool = null;
var config = 'wsp';

process.argv.forEach(function(val, index, array) {
    if (index === 2) {
        config = val;
    }
});

fs.readFile('./' + config + '.yml', 'utf8', function(err, data) {
    if (err) {
        return console.log(err);
    }
    wsp_port = ephp.readParam(data, 'port:', wsp_port);
    server.listen(wsp_port);
    console.log('WSP service enabled on port ' + wsp_port);
    
    server_number = ephp.readParam(data, 'server_number:', server_number);
    console.log('Server number ' + server_number);
    
    http_wsp = ephp.readParam(data, 'http_wsp:', http_wsp);
    console.log('connected to http://' + http_wsp);

    database_host = ephp.readParam(data, 'database_host:', database_host);
    database_port = ephp.readParam(data, 'database_port:', database_port);
    database_name = ephp.readParam(data, 'database_name:', database_name);
    database_user = ephp.readParam(data, 'database_user:', database_user);
    database_password = ephp.readParam(data, 'database_password:', database_password);

    db_pool = mysql.createPool({
        database: database_name,
        port: database_port,
        host: database_host,
        user: database_user,
        password: database_password
    });
    console.log('Connected to db');
});

io.sockets.on('connection', function(socket) {

    socket.on('login', function(data) {
        var options = {
          host: http_wsp,
          path: '/login',
          method: 'GET'          
        };

        ephp.httpRequest(options, function(str) {
            var $dom = $(str); 
            console.log($dom);
            socket.emit('login', str);
            var options = {
              host: http_wsp,
              path: '/login_check?_username='+data._username+'&_password='+data._password+'&_remember_me=on',
              method: 'POST',

            };
        });
    });
    
    socket.on('logout', function(data) {
    });

});
