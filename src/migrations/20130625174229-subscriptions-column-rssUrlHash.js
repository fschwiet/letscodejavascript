
var Q = require("q");

var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {

    var runSql = Q.nbind(db.runSql, db);

    return runSql("ALTER TABLE subscriptions ADD COLUMN rssUrlHash varchar(40)")
    .then(function() {
        return runSql(
            "CREATE TRIGGER trig_subscriptions_update_rssUrlHash BEFORE UPDATE " +
            "ON subscriptions " +
            "FOR EACH ROW BEGIN " +
            "     SET new.rssUrlHash = SHA1(new.rssUrl);" +
            "END; ");
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
        return runSql("DROP TRIGGER trig_subscriptions_update_rssUrlHash");
    })
    .then(function() {
        return runSql("ALTER TABLE subscriptions DROP COLUMN rssUrlHash");
    })
    .then(function() {
        callback();
    }, function(err) {
        callback(err);
    });

};
