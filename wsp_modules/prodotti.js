var sugar = require('sugar');

function deg2rad(angle) {
    return angle * (Math.PI/180);
}

var getProdottiNegozio = function(db_pool, data, callback) {
    db_pool.getConnection(function(error, connection) {
        if (error) {
            return callback({status: 500, error: '[Prodotti.getProdottiNegozio] Can\'t create db pool: ' + error});
        }
        var query =
                "select p.id," +
                "       p.tipologia," +
                "       p.marca," +
                "       p.modello," +
                "       p.descrizione," +
                "       (SELECT CONCAT('http://media.wsprice.it/uploads/', l.path, '/[size]/', l.nome) FROM jf_files l WHERE l.id = p.foto_id ) as foto_principale," +
                "       p.usato," +
                "       s.prezzo_riservato," +
                "       s.prezzo," +
                "       s.prezzo_scontato," +
                "       s.quantita," +
                "       s.esaurimento_scorte," +
                "       s.visualizzazioni" +
                "  from sc_prodotti p" +
                "  left join sc_pubblicazioni s on s.prodotto_id = p.id" +
                " where p.negozio_id = " + connection.escape(data.id)
//                "   and p.stato = " + connection.escape(data.status)
//                "   and p.approvato < now()" +
//                "   and (p.cancellazione is null or p.cancellazione > now())" +
//                "   and now() between s.inizio_inserzione and s.fine_inserzione" +
//                "   and s.inizio_sospensione is null" +
                ;
        connection.query(query, function(err, rows) {
            if (err) {
                return callback({status: 500, error: '[Prodotti.getProdottiNegozio] Can\'t execute query (1): ' + err});
            }
            callback({status: 200, negozi: rows});
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