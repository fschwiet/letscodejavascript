
var Q = require("q");
var sha1 = require("sha1");

var database = require("../database.js");

exports.markPostAsRead = function(userId, url) {

    var urlHash = sha1(url);

    return database.getPooledConnection()
    .then(function(connection)
    {
        return Q.ninvoke(connection, "query", 
            " INSERT INTO userPostsRead (userId, url, urlHash) " +
            " SELECT N.* FROM (SELECT ? as userId, ? as url, ? as urlHash) AS N " +
            " LEFT JOIN userPostsRead U ON U.userId = N.userId AND U.urlHash = N.urlHash " +
            " WHERE U.id IS NULL ", 
                [
                    userId, 
                    url,
                    urlHash
                ])
        .then(function() {
            // prevent the result from reaching the caller
        })
        .fin(function() {
            connection.release();
        });
    });
};

exports.markPostAsUnread = function(userId, url) {

    return database.getPooledConnection()
    .then(function(connection)
    {
        return Q.ninvoke(connection, "query", "DELETE FROM userPostsRead WHERE userId = ? AND urlHash = ?", [userId, sha1(url)])
        .then(function() {
            // prevent the result from reaching the caller
        })
        .fin(function() {
            connection.release();
        });
    });
};