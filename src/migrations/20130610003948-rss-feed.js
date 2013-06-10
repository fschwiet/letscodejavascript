var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {

    db.createTable('users', {
        id: { type: 'int', primaryKey: true, autoIncrement: true},
        friendlyName: { type: 'text'}
    });

    db.createTable('googleProfiles', {
        id:  { type: 'string', length: 128, primaryKey: true},
        userId: { type: 'int'},
        profile: { type: 'text'}
    });

    db.createTable('subscriptions', {
        id: { type: 'int', primaryKey: true},
        name: { type: 'text'},
        htmlUrl: { type: 'text'},
        rssUrl: { type: 'text'}
    });

    callback();
};

exports.down = function(db, callback) {

    db.dropTable('subscription');
    db.dropTable('googleProfile');
    db.dropTable('users');

    callback();
};
