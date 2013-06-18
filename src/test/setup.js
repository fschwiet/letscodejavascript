var Q = require('q');
var assert = require("assert");
var fs = require("fs");
var http = require("http");
var path = require("path");
var RSS = require("rss");
var setDefault = require('set-default');

var config = require("./../server/config.js");
var database = require("../server/database.js");

var phantom = require("./node-phantom-shim.js");


exports.qtest = function(context, name, testImplementation) {

    context[name] = function(test) {

        testImplementation = testImplementation || function(promise) {
            promise.reject("not implemented");
            return promise;
        };

        testImplementation()
            .then(function() {
                test.done();
            }, function(err) {
                test.ok(false, err);
                test.done();
            });
    };
};

exports.shouldFail = function(promiseFactory, expectedText) {

    return promiseFactory()
        .then(function() {
            throw new Error("Expected exception");
        }, function(err) {
            if (expectedText) {
                assert.ok(err.toString().indexOf(expectedText) > -1,
                    "Did not see expected error text :" + expectedText + "\nActual text was " + err.toString());
            }
        });
};

//
//  Callback is passed 1 parameter, the phantom.js instance
//

var cachedPhantom = null;
var cachedPage = null;

exports.usingPhantom = function(callback) {

    return function() {

        if (cachedPage !== null) {
            return callback(cachedPage);
        }

        return phantom.promise
            .create()
            .then(function(phantom) {
                return phantom.promise.createPage()
                    .then(function(page) {

                        /*
                if (cachedPage === null) {
                    console.log("caching page");
                    cachedPhantom = phantom;
                    cachedPage = page;
                    return callback(cachedPage);
                } else {
                    */
                        return callback(page)
                            .fail(function(err) {
                                return page.promise
                                    .evaluate(function() {
                                        return {
                                            title: document.title,
                                            url: window.location.toString()
                                        };
                                    })
                                    .then(function(evaluation) {
                                        console.log("page info", JSON.stringify(evaluation, null, "  "));
                                    })
                                    .then(function() {
                                        var screenshot = path.resolve("./temp/phantom.png");
                                        console.log("saving phantom screenshot to", screenshot);
                                        return page.promise.render(screenshot);
                                    })
                                    .fin(function() {
                                        throw err;
                                    });
                            })
                            .fin(function() {
                                phantom.exit();
                            });
                        //}
                    });
            });
    };
};

exports.clearPhantomCache = function() {

    var cached = cachedPhantom;
    cachedPage = null;
    cachedPhantom = null;

    if (cached !== null) {
        console.log("ph.exit called");
        cached.exit();
    }
};


var runServer = require("./runServer");

exports.whenRunningTheServer = function(outer) {

    var inner = {};

    outer.whenRunningTheServer = inner;

    inner.setUp = runServer.startServerLikeIIS;
    inner.tearDown = runServer.stopServer;

    return inner;
};

exports.givenCleanDatabase = function(outer) {

    var inner = {};

    outer.givenCleanDatabase = inner;

    inner.setUp = require("../server/database.js").emptyDatabase;

    return inner;
};


exports.given3rdPartyRssServer = function(outer, opts) {

    console.log("opts", opts);

    opts = setDefault(opts).to({
            host: "127.0.0.76",
            port: config.get("server_port"),
            feedName: "FeedForAll Sample Feed",
            postName: "RSS Solutions for Restaurants",
            postUrl: "http://www.feedforall.com/restaurant.htm"
        });

    console.log("opts", JSON.stringify(opts).slice(0, 40));

    var server;

    var inner = {};

    outer.given3rdPartyRssServer = inner;

    inner.setUp = function(done) {
        var app = require('express')();
        app.get("/rss", function(req, res) {

            var feed = new RSS({
                    title: opts.feedName
                });

            feed.item({
                    title: opts.postName,
                    url: opts.postUrl
                });

            res.send(feed.xml());
        });

        app.get("/status", function(req, res) {
            res.send("given3rdPartyRssServer OK");
        });

        server = http.createServer(app);

        server.listen(opts.port, opts.host, done);

    };

    inner.tearDown = function(done) {
        server.close(done);
    };

    return inner;
};