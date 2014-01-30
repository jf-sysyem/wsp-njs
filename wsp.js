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

        ephp.getRequest(options_get, function(str, status, headers) {
            if (status !== 200) {
                socket.emit('login', {status: 500, error: 'Can\'t load login page: ' + status});
                return;
            }
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
            ephp.postRequest(options_post, querystring.stringify(post_data), function(str, status, headers) {
                console.log(str);
                console.log(headers);
                if (status !== 302) {
                    socket.emit('login', {status: 500, error: 'Can\'t check login: ' + status});
                    return;
                }
                if (headers.location === 'http://' + http_wsp + '/login') {
                    socket.emit('login', {status: 401, error: 'User not authorized'});
                } else {
                    db_pool.getConnection(function(error, connection) {
                        if (error) {
                            socket.emit('login', {status: 500, error: 'Can\'t create db pool: ' + error});
                            return;
                        }
                        var query =
                                " SELECT salt" +
                                "  FROM acl_gestori g " +
                                " WHERE g.username = " + connection.escape(data._username) ;
                        connection.query(query, function(err, rows) {
                            if (err) {
                                socket.emit('login', {status: 500, error: 'Can\'t execute query: ' + err});
                                return;
                            }
                            connection.end();
                            if (rows.length === 0) {
                                socket.emit('login', {status: 500, error: 'Can\'t find user'});
                                return;
                            } else {
                                socket.emit('login', {status: 200, token: rows[0].salt});
                            }
                        });
                    });

                }
            });
        });
    });

    socket.on('logout', function(data) {
    });

});
