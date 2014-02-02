var sugar = require('sugar');

var users = {};

var getUserFromToken = function(db_pool, token, callback) {
    if (users[token]) {
        callback({status: 200, user: users[token]});
    } else {
        db_pool.getConnection(function(error, connection) {
            if (error) {
                return callback({status: 500, error: '[WSP.getUserToken] Can\'t create db pool: ' + error});
            }
            var query =
                    " SELECT g.cliente_id as id, g.email, CONCAT(g.firstname, ' ', g.lastname) as name" +
                    "  FROM acl_gestori g " +
                    " WHERE g.salt = " + connection.escape(token);
            connection.query(query, function(err, rows) {
                if (err) {
                    return callback({status: 500, error: '[WSP.getUserToken] Can\'t execute query: ' + err});
                }
                connection.end();
                if (rows.length === 0) {
                    callback({status: 500, error: '[WSP.getUserToken] Can\'t find user'});
                } else {
                    users[token] = rows[0];
                    callback({status: 200, user: users[token]});
                }
            });
        });
    }
};

exports.getUserFromToken = getUserFromToken;