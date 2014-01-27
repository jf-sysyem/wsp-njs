var express = require('express')
        , app = express()
        , server = require('http').createServer(app)
        , io = require('socket.io').listen(server)
        , sugar = require('./ephp_modules/node_modules/sugar')
        , fs = require('fs')
        , ephp = require('./ephp_modules/utility')
        , mysql = require('mysql')
//        , $ = require('jquery').create()
        , $ = require('cheerio')
        , querystring = require('querystring')
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
        var options_get = {
          host: http_wsp,
          path: '/login',
          method: 'GET'          
        };
/*
        $.get(http_wsp+'/login', function(html){
            var $dom = $(html); 
            
        });
*/
        
        ephp.getRequest(options_get, function(str, status, headers) {
            var $dom = $(str); 
            var csrf_token = $dom.find('#csrf_token').val();
            var post_data = {
                _username: data._username,
                _password: data._password,
                _remember_me: 'on',
                _csrf_token: csrf_token
            };
            var options_post = {
              host: http_wsp,
              path: '/login_check',
              method: 'POST',
              headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'Content-Length': querystring.stringify(post_data).length,
                  'Cookie': headers['set-cookie']
              }
            };
            console.log(options_post);
            console.log(post_data);
            console.log(querystring.stringify(post_data));
            ephp.postRequest(options_post, querystring.stringify(post_data), function(str, status, headers2) {
                console.log(str);
                console.log(status);
                console.log(headers);
                if(headers.location === 'http://'+http_wsp+'/login') {
                    
                } else {
                    
                }
            /*
                ephp.httpRequest(options, function(str) {
                    var $dom = $(str); 
                    var span = $dom.find('.alert-danger').find('span');
                    socket.emit('login', span.html());
                });
             */
            });
        });
    });
    
    socket.on('logout', function(data) {
    });

});
