var dbm = require('db-migrate');
var type = dbm.dataType;

var Q = require("q");

exports.up = function(db, callback) {

    var runSql = Q.nbind(db.runSql, db);

    runSql("ALTER TABLE subscriptions ADD COLUMN userId INT")
        .then(function() {
            return runSql("ALTER TABLE subscriptions MODIFY COLUMN id int auto_increment");
        })
        .then(function() {
            callback();
        }, function(err) {
            callback(err);
        });
};

exports.down = function(db, callback) {

    var runSql = Q.nbind(db.runSql, db);

    return runSql("ALTER TABLE subscriptions MODIFY COLUMN id int")
        .then(function() {
            return runSql("ALTER TABLE subscriptions DROP COLUMN userId");
        })
        .then(function() {
            callback();
        }, function(err) {
            callback(err);
        });
};