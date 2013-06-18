
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
        } else if (Math.floor(response.statusCode / 100) !== 2) {
            deferred.reject("Expected 200 response code, was " + response.statusCode);
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
                    };
                }));
            }
        } catch(e) {
            deferred.reject(e);
        }
    }));

    return deferred.promise;
}

module.exports.loadFeeds = loadFeeds;