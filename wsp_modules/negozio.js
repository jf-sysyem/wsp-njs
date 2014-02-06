var sugar = require('sugar');

function deg2rad(angle) {
    return angle * (Math.PI/180);
}

var getNegoziUser = function(db_pool, user, callback) {
    db_pool.getConnection(function(error, connection) {
        if (error) {
            return callback({status: 500, error: '[Negozio.getNegozi] Can\'t create db pool: ' + error});
        }
        var query =
                "SELECT n.id," +
                "       n.nome," +
                "       c.categoria," +
                "       CONCAT('/bundles/wspadmin/images/shop-icon/', c.image) as logo_categoria," +
                "       n.logo as logo_negozio," +
                "       n.indirizzo," +
                "       n.localita," +
                "       n.cap," +
                "       n.latitudine," +
                "       n.longitudine," +
                "       n.descrizione," +
                "       n.telefono," +
                "       n.cellulare," +
                "       n.email_negozio as email," +
                "       n.sito," +
                "       n.orari," +
                "       n.aperture_speciali," +
                "       n.ambulante" +
                "  FROM acl_negozio n " +
                "  LEFT JOIN acl_categorie c ON n.categoria_id = c.id" +
                " WHERE n.cliente_id = " + connection.escape(user.id);
        connection.query(query, function(err, rows) {
            if (err) {
                return callback({status: 500, error: '[Negozio.getNegozi] Can\'t execute query (1): ' + err});
            }
            var output = [];
            rows.each(function(row){
                var query =
                        "SELECT c.categoria," +
                        "       CONCAT('/bundles/wspadmin/images/shop-icon/', c.image) as logo_categoria" +
                        "  FROM acl_categorie c " +
                        "  LEFT JOIN acl_categorie_negozi n ON n.categoria_id = c.id" +
                        " WHERE n.negozio_id = " + connection.escape(row.id);
                connection.query(query, function(err, cats) {
                    if (err) {
                        return callback({status: 500, error: '[Negozio.getNegozi] Can\'t execute query (2): ' + err});
                    }
                    row['categorie'] = cats;
                    output.add(row);
                    if(output.length === rows.length) {
                        connection.end();
                        callback({status: 200, negozi: output});
                    }
                });
            });
        });
    });
};

var setDatiNegozio = function(db_pool, user, negozio, dati, callback) {
    db_pool.getConnection(function(error, connection) {
        if (error) {
            return callback({status: 500, error: '[Negozio.setDatiNegozio] Can\'t create db pool: ' + error});
        }
        var data = Object.extended(dati);
        var set = "";
        data.keys().each(function(k) {
            if(k === 'email') {
                k = "email_negozio";
            }
            if(set === "") {
                set += "   SET n."+k+" = " + connection.escape(data[k]);
            } else {
                set += "     , n."+k+" = " + connection.escape(data[k]);
            }
            if(k === 'latitudine' || k === 'longitudine') {
                set += "     , n."+k+"rad = " + connection.escape(deg2rad(data[k]));
            }
        });
        var query =
                "UPDATE acl_negozio n " +
                set +
                " WHERE n.cliente_id = " + connection.escape(user.id) +
                "   AND n.id = " + connection.escape(negozio);
        connection.query(query, function(err, rows) {
            if (err) {
                return callback({status: 500, error: '[Negozio.setDatiNegozio] Can\'t execute query: ' + err});
            }
            connection.end();
            switch(rows.affectedRows) {
                case 1: callback({status: 200});
                    break;
                case 0: callback({status: 401, error: 'Unauthorized operation'});
                    break;
                default:callback({status: 500, error: 'CRITICAL ERROR: to many rows modified'});
                    break;
            }
        });
    });
};

exports.getNegoziUser = getNegoziUser;
exports.setDatiNegozio = setDatiNegozio;