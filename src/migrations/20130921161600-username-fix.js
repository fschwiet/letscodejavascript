var dbm = require('db-migrate');
var type = dbm.dataType;

var Q = require("q");

exports.up = function(db, callback) {

    var runSql = Q.nbind(db.runSql, db);

    Q()
    .then(function() {
        console.log(1);
        return runSql("ALTER TABLE userpasswords ADD COLUMN username VARCHAR(64)");
    })
    .then(function() {
        console.log(2);
        return runSql("UPDATE userPasswords UP " +
                      "JOIN USERS U ON U.id = UP.userId " +
                      "SET UP.username = u.friendlyName ");
    })
    .then(function() {
        console.log(3);
    })
    .then(callback, callback);
};

exports.down = function(db, callback) {

    var runSql = Q.nbind(db.runSql, db);

    Q()
    .then(function() {
        return runSql("ALTER TABLE userpasswords DROP COLUMN username");
    })
    .then(callback, callback);
};