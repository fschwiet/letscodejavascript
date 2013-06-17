

var assert = require("assert");
var Q = require("q");
var fs = require("fs");
var http = require("http");
var request = require("request");
var RSS = require("rss");


var config = require("../server/config.js");
var setup = require("../test/setup.js");


setup.whenRunningTheServer(exports);

var server;

exports.withFeedServer = {
    setUp : function(done) {
        var app = require('express')();
        app.get("/rss", function(req, res) {

            var feed = new RSS({
                title:"FeedForAll Sample Feed"
            });

            feed.item({
                title: "RSS Solutions for Restaurants",
                url: "http://www.feedforall.com/restaurant.htm"
            });

            res.send(feed.xml());
        });

        server = http.createServer(app);

        server.listen(8081, "127.0.0.76", done);

    },
    tearDown: function(done) {
        server.close(done);
    }
};

setup.qtest(exports.withFeedServer, "Should be able to load RSS feeds", function() {

    var url = config.urlFor("/posts", { rssUrl: "http://127.0.0.76:8081/rss"});

    return Q.nfcall(request, url)
    .then(function(arr) {

        var body = arr[1];
        console.log("body", body);

        assert.equal(body, JSON.stringify([
                {
                    feedName: "FeedForAll Sample Feed",
                    postName: "RSS Solutions for Restaurants",
                    postUrl: "http://www.feedforall.com/restaurant.htm"
                }
            ]));
    });
});