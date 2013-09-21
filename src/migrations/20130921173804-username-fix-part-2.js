
var dbm = require('db-migrate');
var type = dbm.dataType;

var Q = require("q");


exports.up = function(db, callback) {

    var runSql = Q.nbind(db.runSql, db);

    Q()
    .then(function() {
        return runSql("ALTER TABLE userpasswords ADD UNIQUE idx_userspasswords_username (username);");
    })
    .then(function() {
        callback();
    }, function(err) {
        callback(err);
    });
};


exports.down = function(db, callback) {

    var runSql = Q.nbind(db.runSql, db);

    Q()
    .then(function() {
        return runSql("ALTER TABLE userpasswords DROP INDEX idx_userspasswords_username;");
    })
    .then(function() {
        callback();
    }, function(err) {
        callback(err);
    });
};
