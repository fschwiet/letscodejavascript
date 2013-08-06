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

var dataUserPostsRead = require("./data/userPostsRead.js");
var dataRssUrlStatus = require("./data/rssUrlStatus.js");
var dataFeedPosts = require("./data/feedPosts.js");

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

        loadFeedsThroughDatabase(req.rssUrl, req.user.id, new Date())
            .then(function(results) {
                res.setHeader("Content-Type", "application/json");
                res.send(JSON.stringify(results));
            }, function(err) {
                res.setHeader("Content-Type", "application/json");
                res.send(JSON.stringify([]));
            });
    });

    app.post("/posts/finished", function(req,res,next) {

        dataUserPostsRead.markPostAsRead(req.user.id, req.rssUrl)
        .then(function() {
            res.status(200).send("ok");
        }, function(err) {
            next(err);
        });
    });

    app.post("/posts/unfinished", function(req,res,next) {

        dataUserPostsRead.markPostAsUnread(req.user.id, req.rssUrl)
        .then(function() {
            res.status(200).send("ok");
        }, function(err) {
            next(err);
        });
    });
};

function loadMeta(rssUrl) {

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
    .on('meta', function(meta) {
        deferred.resolve({
            feedName : meta.title,
            feedLink : meta.link || rssUrl
        });
    });

    return deferred.promise;
}

module.exports.loadMeta = loadMeta;

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

                    var mappedResults = results.map(function(val) {
                        return {
                            feedName: val.meta.title,
                            postName: val.title,
                            postUrl: val.link,
                            postDate: val.date
                        };
                    });

                    deferred.resolve(mappedResults);
                }
            } catch (e) {
                deferred.reject(e);
            }
        }));

    return deferred.promise;
}

module.exports.loadFeeds = loadFeeds;

function loadFeedsThroughDatabase(rssUrl, userId, readTime) {

    return Q()
    .then(function() {
        return dataRssUrlStatus.checkIfUrlNeedsUpdate(rssUrl, readTime)
        .then(function(result) {
            
            if (result) {
                
                return loadFeeds(rssUrl)
                .then(function(posts){
                    return dataFeedPosts.writePostsToDatabase(rssUrl, posts)
                    .then(function() {
                        return dataRssUrlStatus.writeRssUrlStatus(rssUrl, "ok", readTime);
                    });
                }, function(err) {
                    return dataRssUrlStatus.writeRssUrlStatus(rssUrl, err.toString(), readTime);
                });
            }
        });
    })
    .then(function() {
        return dataFeedPosts.loadPostsFromDatabase(rssUrl, userId);
    });
}


module.exports.loadFeedsThroughDatabase = loadFeedsThroughDatabase;

