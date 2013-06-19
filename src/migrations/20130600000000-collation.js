var dbm = require('db-migrate');
var type = dbm.dataType;
var Q = require("q");

var config = require("../server/config.js");

exports.up = function(db, callback) {

    db.runSql("ALTER DATABASE " + config.get("database_name") + " DEFAULT COLLATE utf8_general_ci", callback);
};

exports.down = function(db, callback) {

    callback();
};