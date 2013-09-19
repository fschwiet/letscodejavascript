
var Q = require("q");
var sha1 = require("sha1");

var database = require("../database.js");

function formatDateForMysql(date) {

    return date.getUTCFullYear() + '-' +
        ('00' + (date.getUTCMonth()+1)).slice(-2) + '-' +
        ('00' + date.getUTCDate()).slice(-2) + ' ' + 
        ('00' + date.getUTCHours()).slice(-2) + ':' + 
        ('00' + date.getUTCMinutes()).slice(-2) + ':' + 
        ('00' + date.getUTCSeconds()).slice(-2) + '.' +
        ('000' + date.getUTCMilliseconds()).slice(-3);
}

exports.writePostsToDatabase = function(rssUrl, posts) {

    var rssUrlHash = sha1(rssUrl);

    var inserts = posts.map(function(post) {

        var postRecord = {
            feedName : post.feedName,
            postName : post.postName,
            postUrl : post.postUrl,
            postDate : post.postDate,
            rssUrl: rssUrl,
            postUrlHash : sha1(post.postUrl),
            rssUrlHash : rssUrlHash
        };

        if (postRecord.postDate === null) {
            postRecord.postDate = new Date();
        }

        return function() {

            return Q()
            .then(function() {
                return database.getPooledConnection();
            })
            .then(function(connection)
            {
                return Q.ninvoke(connection, "query", 
                    "INSERT INTO feedPosts (feedName, postName, postUrl, postDate, rssUrl, postUrlHash, rssUrlHash) " + 
                    "SELECT N.* FROM (SELECT ? as feedName, ? as postName, ? as postUrl, ? as postDate, ? as rssUrl, ? as postUrlHash, ? as rssUrlHash) AS N " +
                    "LEFT JOIN feedPosts F ON F.rssUrlHash = N.rssUrlHash AND F.postUrlHash = N.postUrlHash " +
                    "WHERE F.id IS NULL",
                    [
                        postRecord.feedName, 
                        postRecord.postName, 
                        postRecord.postUrl, 
                        formatDateForMysql(postRecord.postDate), 
                        postRecord.rssUrl, 
                        postRecord.postUrlHash, 
                        postRecord.rssUrlHash
                    ])
                .fin(function() {
                    connection.release();
                });
            });
        };
    });

    return inserts.reduce(function(soFar, f) {
            return soFar.then(f);
        }, Q());
};

exports.loadPostsFromDatabase = function(rssUrl, userId) {

    var rssUrlHash = sha1(rssUrl);

    return Q()
    .then(function() {
        return database.getPooledConnection();
    })
    .then(function(connection){

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
            connection.release();
        });
    });
};