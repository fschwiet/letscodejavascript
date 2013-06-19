var dbm = require('db-migrate');
var type = dbm.dataType;

var Q = require("q");

var utils = require("./utils/utils.js");

exports.up = function(db, callback) {

    var runSql = Q.nbind(db.runSql, db);

    runSql(utils.addDateCreated("feedPosts"))
        .then(function() {
            return runSql(utils.addDateCreated("userPostsRead"));
        })
        .then(function() {
            callback();
        }, function(err) {
            callback(err);
        });
};

exports.down = function(db, callback) {

    var runSql = Q.nbind(db.runSql, db);

    runSql(utils.dropColumn("userPostsRead", "dateCreated"))
        .then(function() {
            return runSql(utils.dropColumn("feedPosts", "dateCreated"));
        })
        .then(function() {
            callback();
        }, function(err) {
            callback(err);
        });
};