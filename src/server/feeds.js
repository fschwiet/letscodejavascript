var endpoint = require('endpoint');
var fs = require("fs");
var feedfinder = require("feedfinder");
var xml2js = require("xml2js");
var Q = require("q");
var request = require("request");

var modelFor = require("./modelFor.js");
var dataSubscriptions = require("./data/subscriptions.js");
var posts = require("./posts.js");

module.exports = function(app) {
    app.get("/feeds", handleFeedsRequest);
    app.post("/feeds", handleUploadFromGooglePostRequest);
    app.post("/feeds/subscribe", handleSubscribeRequest);
    app.post("/feeds/unsubscribe", handleUnsubscribe);
};

function handleFeedsRequest(request, response) {

    var model = modelFor("Manage your RSS feed subscriptions", request);

    if (typeof request.user == "object") {
        dataSubscriptions.loadSubscriptions(request.user.id)
            .then(function(subscriptions) {

                model.rows = subscriptions;

                response.render('feedsPage', model);
            });
    } else {

        response.render('feedsPage_unauthenticated', model);
    }
}

function handleUploadFromGooglePostRequest(request, response, next) {

    var subscriptionsPath = request.files.subscriptionsXml.path;

    loadSubscriptionsFromGoogleXml(subscriptionsPath)
        .then(function(rows) {

            dataSubscriptions.saveSubscriptions(request.user.id, rows)
                .then(function() {
                    request.flash("info", "Upload complete.  Now just go to the <a href='/'>homepage</a> when you want to read them.");
                    response.redirect("/feeds");
                }, function(err) {
                    next(err);
                });
        });
}

function loadSubscriptionsFromGoogleXml(filepath) {

    var deferred = Q.defer();
    var parser = new xml2js.Parser();

    fs.readFile(filepath, function(err, data) {

        if (err) {
            deferred.reject(err);
        } else {
            parser.parseString(data, function(err, result) {

                if (err) {
                    deferred.reject(err);
                } else {
                    var rows = [];

                    try {
                        result.opml.body[0].outline.forEach(function(row) {
                            rows.push({
                                    name: row.$.title,
                                    rssUrl: row.$.xmlUrl,
                                    htmlUrl: row.$.htmlUrl
                                });
                        });
                    } catch (ex) {
                        deferred.reject(ex);
                        return;
                    }

                    deferred.resolve(rows);
                }
            });
        }
    });

    return deferred.promise;
}

function handleSubscribeRequest(request, response, next) {

    var rssUrl = request.body.rssUrl;

    posts.loadMeta(rssUrl)
    .fail(function(err) {

        if (err.message.indexOf('Not a feed') > -1) {
            return locateFeedWithFeedFinder(rssUrl)
            .then(function(result) {
                rssUrl = result.rssUrl;
                return posts.loadMeta(rssUrl);
            });
        }
        else {
            throw err;
        }
    })
    .then(function(meta) {

        return dataSubscriptions.saveSubscriptions(request.user.id, [
                {
                    name: meta.feedName,
                    rssUrl: rssUrl,
                    htmlUrl: meta.feedLink
                }
            ])
            .then(function() {
                request.flash('info', "You have subscribed to feed '" + meta.feedName + "'.");
                response.redirect("/feeds");
            });
    })
    .fail(function(err) {
        next(err);
    });
}

function locateFeedWithFeedFinder(htmlUrl) {
    var deferred = Q.defer();

    request(htmlUrl, function(error, response, body) {
        if (error !== null) {
            deferred.reject(error);
        }
    })
    .pipe(feedfinder(htmlUrl))
    .pipe(endpoint({
            objectMode: true
        }, function(err, links) {

            if (err !== null) {
                deferred.reject(err);
            } else {
                var results = [];
                links.forEach(function(link) {
                    if (link.type == "rss" || link.type == "atom") {
                        results.push(link.href);
                    }
                });

                // returning only the shortest result
                results = results.sort(function(a, b) {
                    return a.length - b.length;
                });

                if (results.length > 0) {
                    deferred.resolve({
                            rssUrl: results[0]
                        });
                } else {
                    deferred.reject(new Error("not found"));
                }
            }
        }));

    return deferred.promise;
}

function handleUnsubscribe(request, response, next) {

    dataSubscriptions.unsubscribe(request.user.id, request.body.rssUrl)
        .then(function() {
            response.send();
        }, function(err) {
            next(err);
        });
}