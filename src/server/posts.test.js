var assert = require("assert");
var Q = require("q");
var request = require("request");

var config = require("../server/config.js");
var posts = require("../server/posts.js");
var setup = require("../test/setup.js");

var testWithRssOnly = setup.given3rdPartyRssServer(exports);
var testBlock = setup.whenRunningTheServer(testWithRssOnly);

setup.qtest(testBlock, "Should be able to load RSS feeds", function() {

    var url = config.urlFor("/posts", {
            rssUrl: "http://127.0.0.76:8081/rss/foo"
        });

    return Q.nfcall(request, url)
        .then(function(arr) {

            var response = arr[0];
            var body = arr[1];

            assert.equal(body, JSON.stringify([{
                            feedName: "FeedForAll Sample Feed",
                            postName: "RSS Solutions for Restaurants",
                            postUrl: "http://www.feedforall.com/restaurant.htm",
                            postDate: new Date("June 1, 2013")
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

setup.qtest(testWithRssOnly, "loadFeeds should be able to load RSS feeds", function() {

    return posts.loadFeeds("http://127.0.0.76:8081/rss/foo")
    .then(function(results) {

        assert.equal(JSON.stringify(results), JSON.stringify([{
                        feedName: "FeedForAll Sample Feed",
                        postName: "RSS Solutions for Restaurants",
                        postUrl: "http://www.feedforall.com/restaurant.htm",
                        postDate: new Date("June 1, 2013")
                    }
                ]));
    });
});

setup.qtest(testWithRssOnly, "loadFeeds should give error if the http request fails", function() {

    return setup.shouldFail(function() {
        return posts.loadFeeds("http://nonexistsantserver.coommmm/rss/foo");
    }, "getaddrinfo ENOTFOUND");
});

setup.qtest(testWithRssOnly, "loadFeeds should give error if the http request fails #2", function() {

    return setup.shouldFail(function() {
        return posts.loadFeeds("http://127.0.0.76:8081/notexistingPath");
    }, "Not a feed");
});


setup.qtest(testWithRssOnly, "loadFeedsThroughDatabase should be able to load RSS feeds", function() {

    return posts.loadFeedsThroughDatabase("http://127.0.0.76:8081/rss/" + require('node-uuid').v4())
    .then(function(results) {

        assert.equal(JSON.stringify(results), JSON.stringify([{
                        feedName: "FeedForAll Sample Feed",
                        postName: "RSS Solutions for Restaurants",
                        postUrl: "http://www.feedforall.com/restaurant.htm",
                        postDate: new Date("June 1, 2013")
                    }
                ]));
    });
});
