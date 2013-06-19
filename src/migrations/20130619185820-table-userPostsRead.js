var Q = require("q");
var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {

    Q.ninvoke(db, "createTable", 'userPostsRead', {
            id: {
                type: 'int',
                primaryKey: true,
                autoIncrement: true
            },
            userId: { type: 'int' },
            url: { type: 'text' },
            urlHash: { type: 'string', length:40 }
        })
    .then(function() {
        return Q.ninvoke(db, "addIndex", "userPostsRead", "IDX_userPostsRead_userId_urlHash", ["userId", "urlHash"]);
    })
    .then(function() {
        callback();
    }, function(err) {
        callback(err);
    });
};

exports.down = function(db, callback) {

    Q.ninvoke(db, "removeIndex", "userPostsRead", "IDX_userPostsRead_userId_urlHash")
    .then(function() {
        return Q.ninvoke(db, "dropTable", "userPostsRead");
    })
    .then(function() {
        callback();
    }, function(err) {
        console.log("err", err);
        callback(err);
    });
};
