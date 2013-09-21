var dbm = require('db-migrate');
var type = dbm.dataType;

var Q = require("q");

var utils = require("cauldron").sqlExpressions;

exports.up = function(db, callback) {

    var runSql = Q.nbind(db.runSql, db);

    function addDateCreated(tableName) {
        return "ALTER TABLE " + tableName + " ADD COLUMN dateCreated DATETIME DEFAULT CURRENT_TIMESTAMP";
    }

    function addDateModified(tableName) {
        return "ALTER TABLE " + tableName + " ADD COLUMN dateModified DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP";
    }

    runSql(utils.addDateCreated("users"))
        .then(function() {
            return runSql(utils.addDateModified("users"));
        })
        .then(function() {
            return runSql(utils.addDateCreated("googleProfiles"));
        })
        .then(function() {
            return runSql(utils.addDateModified("googleProfiles"));
        })
        .then(function() {
            return runSql(utils.addDateCreated("subscriptions"));
        })
        .then(function() {
            return runSql(utils.addDateModified("subscriptions"));
        })
        .then(function() {
            callback();
        }, function(err) {
            callback(err);
        });
};

exports.down = function(db, callback) {

    var runSql = Q.nbind(db.runSql, db);

    runSql(utils.dropColumn("subscriptions", "dateModified"))
        .then(function() {
            return runSql(utils.dropColumn("subscriptions", "dateCreated"));
        })
        .then(function() {
            return runSql(utils.dropColumn("googleProfiles", "dateModified"));
        })
        .then(function() {
            return runSql(utils.dropColumn("googleProfiles", "dateCreated"));
        })
        .then(function() {
            return runSql(utils.dropColumn("users", "dateModified"));
        })
        .then(function() {
            return runSql(utils.dropColumn("users", "dateCreated"));
        })
        .then(function() {
            callback();
        }, function(err) {
            callback(err);
        });
};