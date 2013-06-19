/* possible RSS parsers:

https://npmjs.org/package/feedparser
https://npmjs.org/package/nodepie
https://npmjs.org/package/feedr

(there are many more, these looked the most promising)
*/


var Q = require("q");
var request = require("request");
var feedparser = require("feedparser");
var endpoint = require("endpoint");
var sha1 = require("sha1");

var database = require("./database");


module.exports = function(app) {
    app.get("/posts", function(req, res, next) {

        var rssUrl = req.query.rssUrl;

        loadFeeds(rssUrl)
            .then(function(results) {
                res.setHeader("Content-Type", "application/json");
                res.send(JSON.stringify(results));
            }, function(err) {
                res.setHeader("Content-Type", "application/json");
                res.send(JSON.stringify([]));
            });
    });
};

function loadFeeds(rssUrl) {

    var deferred = Q.defer();

    request(rssUrl, function(error, response, body) {
        if (error !== null) {
            deferred.reject(error);
        } else if (Math.floor(response.statusCode / 100) !== 2) {
            deferred.reject("Expected 200 response code, was " + response.statusCode);
        }
    })
    .on('error', function(err) { deferred.reject(err); })
    .pipe(feedparser({
            feedurl: rssUrl
        }))
    .on('error', function(err) { deferred.reject(err); })
    .pipe(endpoint({
            objectMode: true
        }, function(err, results) {

            try {
                if (err !== null) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(results.map(function(val) {
                                return {
                                    feedName: val.meta.title,
                                    postName: val.title,
                                    postUrl: val.link,
                                    postDate: val.date
                                };
                            }));
                }
            } catch (e) {
                deferred.reject(e);
            }
        }));

    return deferred.promise;
}

module.exports.loadFeeds = loadFeeds;

function loadFeedsThroughDatabase(rssUrl, userId) {

    var rssUrlHash = sha1(rssUrl);

    return loadFeeds(rssUrl)
    .then(function(posts){

        var inserts = posts.map(function(post) {

            var postRecord = JSON.parse(JSON.stringify(post));
            
            postRecord.rssUrl = rssUrl;
            postRecord.postUrlHash = sha1(postRecord.postUrl);
            postRecord.rssUrlHash = rssUrlHash;

            var connection = database.getConnection();
            
            return Q.ninvoke(connection, "query", 
                "INSERT INTO feedPosts (feedName, postName, postUrl, postDate, rssUrl, postUrlHash, rssUrlHash) " + 
                "SELECT N.* FROM (SELECT ? as feedName, ? as postName, ? as postUrl, ? as postDate, ? as rssUrl, ? as postUrlHash, ? as rssUrlHash) AS N " +
                "LEFT JOIN feedPosts F ON F.rssUrlHash = N.rssUrlHash AND F.postUrlHash = N.postUrlHash " +
                "WHERE F.id IS NULL",
                [postRecord.feedName, postRecord.postName, postRecord.postUrl, postRecord.postDate, postRecord.rssUrl, postRecord.postUrlHash, postRecord.rssUrlHash])
            .then(function() {}, function(err) { console.log("errr!", err);})
            .fin(function() {
                connection.end();
            });
        });

        return inserts.reduce(Q.when, Q());
    })
    .then(function() {

        console.log("querying...");
        var connection = database.getConnection();

        return Q.ninvoke(connection, "query", "SELECT * FROM feedPosts F LEFT JOIN userPostsRead U on f.postUrlHash = U.urlHash AND U.userId = ? WHERE rssUrlHash = ? AND U.id IS NULL", [userId, rssUrlHash])
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
    });
}

module.exports.loadFeedsThroughDatabase = loadFeedsThroughDatabase;