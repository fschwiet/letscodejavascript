var dbm = require('db-migrate');
var type = dbm.dataType;
var Q = require("q");

exports.up = function(db, callback) {

    var createTable = Q.nbind(db.createTable, db);

    createTable('users', {
            id: {
                type: 'int',
                primaryKey: true,
                autoIncrement: true
            },
            friendlyName: {
                type: 'text'
            }
        })
        .then(function() {
            return createTable('googleProfiles', {
                    id: {
                        type: 'string',
                        length: 128,
                        primaryKey: true
                    },
                    userId: {
                        type: 'int'
                    },
                    profile: {
                        type: 'text'
                    }
                });
        })
        .then(function() {
            return createTable('subscriptions', {
                    id: {
                        type: 'int',
                        primaryKey: true
                    },
                    name: {
                        type: 'text'
                    },
                    htmlUrl: {
                        type: 'text'
                    },
                    rssUrl: {
                        type: 'text'
                    }
                });
        })
        .then(function() {
            callback();
        }, function(err) {
            callback(err);
        });
};

exports.down = function(db, callback) {

    var dropTable = Q.nbind(db.dropTable, db);

    dropTable('subscriptions')
        .then(function() {
            return dropTable('googleProfiles');
        })
        .then(function() {
            return dropTable('users');
        })
        .then(function() {
            callback();
        }, function(err) {
            callback(err);
        });
};