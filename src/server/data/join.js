
var Q = require("q");

var database = require("../database.js");

var _ = require("lodash");

exports.loadPostsForUser = function(userId) {

    return database.getPooledConnection()
    .then(function(connection) {
        return Q()
        .then(function() {
            return Q.ninvoke(connection, "query", 
                "SELECT FP.* FROM feedPosts FP " +
                "LEFT JOIN subscriptions S ON S.rssUrlHash = FP.rssUrlHash AND S.userId = ? " +
                "LEFT JOIN userPostsRead UPR ON UPR.urlHash = FP.postUrlHash AND UPR.userId = ? " +
                "WHERE S.id IS NOT NULL AND UPR.id IS NULL",
                [userId, userId]
                );
        })
        .then(function(results) {
            var mappedResults = results[0].map(function(value) {
                return {
                    feedName : value.feedName, 
                    postName : value.postName, 
                    postUrl : value.postUrl, 
                    postDate : value.postDate
                };
            });

            mappedResults = _.uniq(mappedResults, function(p) { return p.postUrl; });

            return mappedResults;
        })
        .fin(function() {
            connection.release();
        });
    });
};