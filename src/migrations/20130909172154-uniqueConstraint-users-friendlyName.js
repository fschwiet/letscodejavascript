
var Q = require("q");

var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
    var runSql = Q.nbind(db.runSql, db);

    return Q()
    .then(function() {
        return runSql("ALTER TABLE users MODIFY friendlyName varchar(64)");
    })
    .then(function() {
        return runSql("ALTER TABLE users ADD UNIQUE (friendlyName);");
    })
    .then(function() {
        callback();
    }, function(err) {
        callback(err);
    });
};

exports.down = function(db, callback) {

    var runSql = Q.nbind(db.runSql, db);

    return Q()
    .then(function() {
        return runSql("ALTER TABLE users DROP UNIQUE (friendlyName);");
    })
    .then(function() {
        return runSql("ALTER TABLE users MODIFY friendlyName TEXT");
    })
    .then(function() {
        callback();
    }, function(err) {
        callback(err);
    });
};
