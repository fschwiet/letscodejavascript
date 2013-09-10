var Q = require("q");
var dbm = require('db-migrate');
var type = dbm.dataType;

var utils = require("./utils/utils.js");

exports.up = function(db, callback) {

    var runSql = Q.nbind(db.runSql, db);
    var createTable = Q.nbind(db.createTable, db);

    createTable('passwordResets', {
            
            id: {
                type: 'int',
                autoIncrement: true,
                primaryKey: true
            },

            uuid: {
                type: 'string',
                unique: true,
                length: 36
            },

            userId: {
                type: 'int',
                notNull: true
            },

        })
    .then(function() {
        return runSql(utils.addDateCreated("passwordResets"));
    })
    .then(function() {
        callback();
    }, function(err) {
        callback(err);
    });
};

exports.down = function(db, callback) {

    var dropTable = Q.nbind(db.dropTable, db);
    var runSql = Q.nbind(db.runSql, db);

    runSql(utils.dropColumn("passwordResets", "dateCreated"))
    .then(function() {
        return dropTable('passwordResets');
    })
    .then(function() {
        callback();
    }, function(err) {
        callback(err);
    });
};

