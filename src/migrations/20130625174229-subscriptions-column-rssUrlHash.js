
var Q = require("q");

var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {

    var runSql = Q.nbind(db.runSql, db);

    return runSql("ALTER TABLE subscriptions ADD COLUMN rssUrlHash varchar(40)")
    .then(function() {
        return Q.ninvoke(db, "addIndex", "subscriptions", "IDX_subscriptions_rssUrlHash", ["rssUrlHash"]);
    })
    .then(function() {
        return runSql(
            "CREATE TRIGGER trig_subscriptions_update_rssUrlHash BEFORE UPDATE " +
            "ON subscriptions " +
            "FOR EACH ROW BEGIN " +
            "     SET new.rssUrlHash = SHA1(new.rssUrl);" +
            "END; ");
    })
    .then(function() {
        return runSql(
            "CREATE TRIGGER trig_subscriptions_insert_rssUrlHash BEFORE INSERT " +
            "ON subscriptions " +
            "FOR EACH ROW BEGIN " +
            "     SET new.rssUrlHash = SHA1(new.rssUrl);" +
            "END; ");
    })
    .then(function() {
        return runSql("UPDATE subscriptions SET rssUrlHash = sha1(rssUrl);");
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
        return runSql("DROP TRIGGER trig_subscriptions_insert_rssUrlHash");
    })
    .then(function() {
        return runSql("DROP TRIGGER trig_subscriptions_update_rssUrlHash");
    })
    .then(function() {
        return Q.ninvoke(db, "removeIndex", "subscriptions", "IDX_subscriptions_rssUrlHash");
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
