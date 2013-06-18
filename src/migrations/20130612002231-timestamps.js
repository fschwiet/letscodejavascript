var dbm = require('db-migrate');
var type = dbm.dataType;

var Q = require("q");

exports.up = function(db, callback) {

    var runSql = Q.nbind(db.runSql, db);

    function addDateCreated(tableName) {
        return "ALTER TABLE " + tableName + " ADD COLUMN dateCreated DATETIME DEFAULT CURRENT_TIMESTAMP";
    }

    function addDateModified(tableName) {
        return "ALTER TABLE " + tableName + " ADD COLUMN dateModified DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP";
    }

    runSql(addDateCreated("users"))
        .then(function() {
            return runSql(addDateModified("users"));
        })
        .then(function() {
            return runSql(addDateCreated("googleProfiles"));
        })
        .then(function() {
            return runSql(addDateModified("googleProfiles"));
        })
        .then(function() {
            return runSql(addDateCreated("subscriptions"));
        })
        .then(function() {
            return runSql(addDateModified("subscriptions"));
        })
        .then(function() {
            callback();
        }, function(err) {
            callback(err);
        });
};

exports.down = function(db, callback) {

    var runSql = Q.nbind(db.runSql, db);

    function dropColumn(tableName, columnName) {
        return "ALTER TABLE " + tableName + " DROP COLUMN " + columnName;
    }

    runSql(dropColumn("subscriptions", "dateModified"))
        .then(function() {
            return runSql(dropColumn("subscriptions", "dateCreated"));
        })
        .then(function() {
            return runSql(dropColumn("googleProfiles", "dateModified"));
        })
        .then(function() {
            return runSql(dropColumn("googleProfiles", "dateCreated"));
        })
        .then(function() {
            return runSql(dropColumn("users", "dateModified"));
        })
        .then(function() {
            return runSql(dropColumn("users", "dateCreated"));
        })
        .then(function() {
            callback();
        }, function(err) {
            callback(err);
        });
};