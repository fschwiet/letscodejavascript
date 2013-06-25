var Q = require("q");
var dbm = require('db-migrate');
var type = dbm.dataType;

var utils = require("./utils/utils.js");

exports.up = function(db, callback) {

    var runSql = Q.nbind(db.runSql, db);

    Q.ninvoke(db, "createTable", 'rssUrlStatus', {
            rssUrlHash: { 
                type: 'string', 
                primaryKey: true, 
                length:40 
            },
            status: { type: 'text'},
            rssUrl: { type: 'text' }
        })
    .then(function() {
        return Q.ninvoke(db, "addIndex", "rssUrlStatus", "IDX_rssUrlStatus_rssUrlHash", ["rssUrlHash"]);
    })
    .then(function() {
        return runSql(utils.addDateModified("rssUrlStatus"));
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
    .then(function()
    {
        return runSql(utils.dropColumn("rssUrlStatus", "dateModified"));
    })
    .then(function() {
        return Q.ninvoke(db, "removeIndex", "rssUrlStatus", "IDX_rssUrlStatus_rssUrlHash");
    })
    .then(function() {
        return Q.ninvoke(db, "dropTable", "rssUrlStatus");
    })
    .then(function() {
        callback();
    }, function(err) {
        callback(err);
    });

};
