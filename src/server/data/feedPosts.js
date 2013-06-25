
var Q = require("q");
var sha1 = require("sha1");

var database = require("../database.js");


exports.writePostsToDatabase = function(rssUrl, posts) {

    var rssUrlHash = sha1(rssUrl);

    var inserts = posts.map(function(post) {

        var postRecord = JSON.parse(JSON.stringify(post));
        
        postRecord.rssUrl = rssUrl;
        postRecord.postUrlHash = sha1(postRecord.postUrl);
        postRecord.rssUrlHash = rssUrlHash;

        return function() {

            var connection = database.getConnection();

            return Q.ninvoke(connection, "query", 
                "INSERT INTO feedPosts (feedName, postName, postUrl, postDate, rssUrl, postUrlHash, rssUrlHash) " + 
                "SELECT N.* FROM (SELECT ? as feedName, ? as postName, ? as postUrl, ? as postDate, ? as rssUrl, ? as postUrlHash, ? as rssUrlHash) AS N " +
                "LEFT JOIN feedPosts F ON F.rssUrlHash = N.rssUrlHash AND F.postUrlHash = N.postUrlHash " +
                "WHERE F.id IS NULL",
                [postRecord.feedName, postRecord.postName, postRecord.postUrl, postRecord.postDate, postRecord.rssUrl, postRecord.postUrlHash, postRecord.rssUrlHash])
            .fin(function() {
                connection.end();
            });
        };
    });

    return inserts.reduce(function(soFar, f) {
            return soFar.then(f);
        }, Q());
};

exports.loadPostsFromDatabase = function(rssUrl, userId) {

    var rssUrlHash = sha1(rssUrl);

    var connection = database.getConnection();

    return Q.ninvoke(connection, "query", 
        "SELECT * FROM feedPosts F LEFT JOIN userPostsRead U on F.postUrlHash = U.urlHash AND U.userId = ? " + 
        "WHERE rssUrlHash = ? AND U.id IS NULL", 
        [userId, rssUrlHash])
    .then(function(result) {

        return result[0].map(function(val) {
            return {
                feedName: val.feedName,
                postName: val.postName,
                postUrl: val.postUrl,
                postDate: val.postDate
            };
        });
    })
    .fin(function() {
        connection.end();
    });
};