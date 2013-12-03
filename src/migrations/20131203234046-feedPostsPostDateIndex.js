var Q = require("q");
var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {

    Q()
    .then(function() {
        return Q.ninvoke(db, "addIndex", "feedPosts", "IDX_feedPosts_postDate", ["postDate"]);
    })
    .then(function() {
        callback();
    }, function(err) {
        callback(err);
    });
};

exports.down = function(db, callback) {

    Q.ninvoke(db, "removeIndex", "feedPosts", "IDX_feedPosts_postDate")
    .then(function() {
        callback();
    }, function(err) {
        console.log("err", err);
        callback(err);
    });
};
