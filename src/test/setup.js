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

        var result = testImplementation.call(this);

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


exports.usingPhantomPage = function(outer) {

    var inner = {};
    outer["using phantom page"] = inner;

    var phantomRef;

    inner.setUp = function(done) {

        var that = this;

        phantom.promise
            .create()
            .then(function(phantom) {

                phantomRef = phantom;

                return phantom.promise.createPage()
                    .then(function(page) {
                        that.page = page;
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


exports.whenRunningTheServer = function(outer) {

    var inner = {};
    outer["when running the server"] = inner;

    var server = require("../server/server.js");

    var thisServerContext = {};
    thisServerContext.extraMiddleware = function(req,res,next) {
        next();
    };

    inner.setUp = function(done) {

        // test setup can modify this.server.extraMiddleware to do extra prep

        this.server = thisServerContext;

        server.start(config.get("server_port"), done, function(req, res, next) {
            thisServerContext.extraMiddleware(req,res,next);
        });
    };

    inner.tearDown = function(done) {
        server.stop(function()
            {
                done();
            });
    };

    return inner;
};

exports.givenCleanDatabase = function(outer) {

    var inner = {};
    outer["given a clean database"] = inner;

    inner.setUp = require("../server/database.js").emptyDatabase;

    return inner;
};


exports.given3rdPartyRssServer = function(outer, opts) {

    var thisRssServerContext = {};

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

        var that = this;

        that.rssServer = thisRssServerContext;
        that.rssServer.requestCount = 0;

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

            that.rssServer.requestCount++;
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

