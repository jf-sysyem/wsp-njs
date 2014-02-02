var sugar = require('sugar');

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

var setDescrizioneNegozio = function(db_pool, user, negozio, descrizione, callback) {
    db_pool.getConnection(function(error, connection) {
        if (error) {
            return callback({status: 500, error: '[Negozio.setDescrizioneNegozio] Can\'t create db pool: ' + error});
        }
        var query =
                "UPDATE acl_negozio n " +
                "   SET n.descrizione = " + connection.escape(descrizione) +
                " WHERE n.cliente_id = " + connection.escape(user.id) +
                "   AND n.id = " + connection.escape(negozio);
        connection.query(query, function(err, rows) {
            if (err) {
                return callback({status: 500, error: '[Negozio.setDescrizioneNegozio] Can\'t execute query: ' + err});
            }
            console.log(rows);
            connection.end();
            callback({status: 200});
        });
    });
};

exports.getNegoziUser = getNegoziUser;
exports.setDescrizioneNegozio = setDescrizioneNegozio;