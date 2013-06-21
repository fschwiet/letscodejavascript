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

        var result = testImplementation();

        if ( !result || typeof result.then !== 'function') {
            test.fail("qtest expects a function that returns a promise.");
            test.done();
        }
        else {
            result
                .then(function() {
                    test.done();
                }, function(err) {
                    test.ok(false, err);
                    test.done();
                });
        }
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

exports.usingPhantomPage = function(outer) {
    var inner = {};
    outer["using phantom page"] = inner;

    var phantomRef;

    inner.setUp = function(done) {

        phantom.promise
            .create()
            .then(function(phantom) {

                phantomRef = phantom;

                return phantom.promise.createPage()
                    .then(function(page) {
                        this.page = page;
                    });
            })
            .then(function() {
                done();
            }, function(err) {
                done(err);
            });
    };

    inner.tearDown = function(done) {

        if (typeof phantomRef !== "undefined") {
            phantomRef.exit();
        }

        done();
    };

    return inner;
};


var runServer = require("./runServer");

exports.whenRunningTheServer = function(outer) {

    var inner = {};

    outer["when running the server"] = inner;

    inner.setUp = runServer.startServerLikeIIS;
    inner.tearDown = runServer.stopServer;

    return inner;
};

exports.givenCleanDatabase = function(outer) {

    var inner = {};

    outer["given a clean database"] = inner;

    inner.setUp = require("../server/database.js").emptyDatabase;

    return inner;
};


exports.given3rdPartyRssServer = function(outer, opts) {

    console.log("opts", opts);

    opts = setDefault(opts).to({
            host: "127.0.0.76",
            port: config.get("server_port"),
            feedName: "FeedForAll Sample Feed",
            posts: [ {
                    postName: "RSS Solutions for Restaurants",
                    postUrl: "http://www.feedforall.com/restaurant.htm",
                    postDate: "June 1, 2013"
                }
            ]
        });

    var server;

    var inner = {};

    outer["given a 3rd part RSS server"] = inner;

    inner.setUp = function(done) {
        var app = require('express')();
        app.get("/rss/*", function(req, res) {

            var feed = new RSS({
                    title: opts.feedName
                });

            opts.posts.forEach(function(post) {

                feed.item({
                        title: post.postName,
                        url: post.postUrl,
                        date: post.postDate
                    });
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


exports.getGoogleProfile = function(postfix) {
    return {
        displayName: 'displayName' + postfix,
        emails: [{
                value: 'emailValue' + postfix
            }
        ],
        name: {
            familyName: 'familyName' + postfix,
            givenName: 'givenName' + postfix
        }
    };
};
