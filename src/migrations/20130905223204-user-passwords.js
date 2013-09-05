var Q = require("q");
var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
    var createTable = Q.nbind(db.createTable, db);

    createTable('userPasswords', {
            
            email: {
                type: 'string',
                length: 254,
                primaryKey: true
            },

            userId: {
                type: 'int'
            },

            passwordHash: {
                type: 'string',
                length: 60
            },
        })
    .then(function() {
        callback();
    }, function(err) {
        callback(err);
    });
};

exports.down = function(db, callback) {

    var dropTable = Q.nbind(db.dropTable, db);

    Q()
    .then(function() {
        return dropTable('userPasswords');
    })
    .then(function() {
        callback();
    }, function(err) {
        callback(err);
    });
};
