
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


module.exports = function(app) {
    app.get("/posts", function(req, res, next) {

        var rssUrl = req.query.rssUrl;

        loadFeeds(rssUrl)
        .then(function(results) {
            res.send(JSON.stringify(results));
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
        }
    })
    .pipe(feedparser({
        feedurl: rssUrl
    }))
    .pipe(endpoint({objectMode: true}, function (err, results) {

        try {
            if (err !== null) {
                deferred.reject(err);
            } else {
                deferred.resolve(results.map(function(val) {
                    return {
                        feedName : val.meta.title,
                        postName: val.title,
                        postUrl: val.link
                    }
                }));
            }
        } catch(err) {
            deferred.reject(err);
        }
    }));

    return deferred.promise;
}