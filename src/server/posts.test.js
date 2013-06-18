var assert = require("assert");
var Q = require("q");
var request = require("request");

var config = require("../server/config.js");
var posts = require("../server/posts.js");
var setup = require("../test/setup.js");

var testBlock = setup.given3rdPartyRssServer(setup.whenRunningTheServer(exports));

setup.qtest(testBlock, "Should be able to load RSS feeds", function() {

    var url = config.urlFor("/posts", {
            rssUrl: "http://127.0.0.76:8081/rss"
        });

    return Q.nfcall(request, url)
        .then(function(arr) {

            var response = arr[0];
            var body = arr[1];

            assert.equal(body, JSON.stringify([{
                            feedName: "FeedForAll Sample Feed",
                            postName: "RSS Solutions for Restaurants",
                            postUrl: "http://www.feedforall.com/restaurant.htm"
                        }
                    ]));

            assert.equal(response.headers["content-type"], "application/json");
        });
});

setup.qtest(testBlock, "Should return empty result for invalid feeds", function() {

    var url = config.urlFor("/posts", {
            rssUrl: "http://127.0.0.76:8081/notexistingPath"
        });

    return Q.nfcall(request, url)
        .then(function(arr) {

            var response = arr[0];
            var body = arr[1];

            assert.equal(body, JSON.stringify([]));

            assert.equal(response.headers["content-type"], "application/json");
        });
});

setup.qtest(testBlock, "Should give error if the http request fails", function() {

    return setup.shouldFail(function() {
        return posts.loadFeeds("http://nonexistsantserver.coommmm/rss");
    }, "getaddrinfo ENOTFOUND");
});

setup.qtest(testBlock, "Should give error if the http request fails #2", function() {

    return setup.shouldFail(function() {
        return posts.loadFeeds("http://127.0.0.76:8081/notexistingPath");
    }, "Not a feed");
});
