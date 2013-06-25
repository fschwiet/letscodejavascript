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


    app.all("/posts*", function(req, res, next){

        if (typeof req.user !== "object") {
            next(new Error("Unauthenticated request made to posts."));
            return;
        }

        req.rssUrl = req.param("rssUrl", null);
        if (req.rssUrl === null) {
            res.status(400).send("Expected parameter rssUrl");
            return;
        }

        next();
    });

    app.get("/posts", function(req, res, next) {

        loadFeedsThroughDatabase(req.rssUrl, req.user.id)
            .then(function(results) {
                res.setHeader("Content-Type", "application/json");
                res.send(JSON.stringify(results));
            }, function(err) {
                res.setHeader("Content-Type", "application/json");
                res.send(JSON.stringify([]));
            });
    });

    app.post("/posts/finished", function(req,res,next) {

        database.markPostAsRead(req.user.id, req.rssUrl)
        .then(function() {
            res.status(200).send("ok");
        }, function(err) {
            next(err);
        });
    });

    app.post("/posts/unfinished", function(req,res,next) {

        database.markPostAsUnread(req.user.id, req.rssUrl)
        .then(function() {
            res.status(200).send("ok");
        }, function(err) {
            next(err);
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

    return loadFeeds(rssUrl)
    .then(function(posts){
        return writePostsToDatabase(rssUrl, posts);
    }, function(err) {
        return writeRssUrlStatus(rssUrl, err.toString());
    })
    .then(function() {
        return loadFeedsFromDatabase(rssUrl, userId);
    });
}

function writePostsToDatabase(rssUrl, posts) {

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
        }, Q())
    .then(function() {
        return writeRssUrlStatus(rssUrl, "ok");
    });
}

function loadFeedsFromDatabase (rssUrl, userId) {

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
}

function writeRssUrlStatus(rssUrl, status) {

    var connection = database.getConnection();

    var newRow = {
            rssUrlHash: sha1(rssUrl),
            status: status,
            rssUrl: rssUrl
        };

    var updateRow = {
            status: status,
            rssUrl: rssUrl
        };

    return Q.ninvoke(connection, "query",
        "INSERT INTO rssUrlStatus SET ? ON DUPLICATE KEY UPDATE ?", [newRow, updateRow])
        .fin(function() {
            connection.end();
        });
}


module.exports.loadFeedsThroughDatabase = loadFeedsThroughDatabase;

