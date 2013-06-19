var Q = require("q");
var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {

    Q.ninvoke(db, "createTable", 'feedPosts', {
            id: {
                type: 'int',
                primaryKey: true,
                autoIncrement: true
            },
            rssUrl: { type: 'text' },
            feedName: { type: 'text' },
            postName: { type: 'text' },
            postUrl: { type: 'text' },
            postDate: { type: 'text' },
            postUrlHash: { type: 'string', length:40 },
            rssUrlHash: { type: 'string', length:40 }
        })
    .then(function() {
        return Q.ninvoke(db, "addIndex", "feedPosts", "IDX_feedPosts_postUrlHash", ["postUrlHash"]);
    })
    .then(function() {
        return Q.ninvoke(db, "addIndex", "feedPosts", "IDX_feedPosts_rssUrlHash", ["rssUrlHash"]);
    })
    .then(function() {
        callback();
    }, function(err) {
        callback(err);
    });
};

exports.down = function(db, callback) {

    Q.ninvoke(db, "removeIndex", "feedPosts", "IDX_feedPosts_rssUrlHash")
    .then(function() {
        return Q.ninvoke(db, "removeIndex", "feedPosts", "IDX_feedPosts_postUrlHash");
    })
    .then(function() {
        return Q.ninvoke(db, "dropTable", "feedPosts");
    })
    .then(function() {
        callback();
    }, function(err) {
        console.log("err", err);
        callback(err);
    });
};
