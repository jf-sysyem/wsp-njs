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


exports.getProdottiNegozio = getProdottiNegozio;