var Q = require('q');
var assert = require("assert");
var fs = require("fs");
var http = require("http");
var smtpTest = require("smtp-tester");
var path = require("path");
var RSS = require("rss");
var setDefault = require('set-default');
var uuid = require("node-uuid");

var config = require("./../server/config.js");
var database = require("../server/database.js");

var phantom = require("./node-phantom-shim.js");

var NodeunitBuilder = require("./nodeunit-builder.js");


exports.qtest = function(context, name, testImplementation) {

    context[name] = function(test) {

        testImplementation = testImplementation || function(promise) {
            promise.reject("not implemented");
            return promise;
        };

        var result;
        var that = this;

        try
        {
            result = testImplementation.call(that);
        }
        catch(err) {
            test.ifError(err);
            test.done();
            return;
        }
         

        if ( !result || typeof result.then !== 'function') {
            test.fail("qtest expects a function that returns a promise.");
            test.done();
        }
        else {
            result
            .then(function() {
                test.done();
            }, 
            function(error) {
                if (that.page) {
                    var screenshotPath = path.resolve(__dirname, "../../test-screenshot.jpg");
                    that.page.render(screenshotPath)
                    .then(function(){
                        console.log("wrote screenshot to", screenshotPath);
                    }, function(renderError) {
                        console.log ("error writing screenshot:", renderError);
                    })
                    .fin(function() {
                        test.ok(false, error);
                        test.done();
                    });
                    return;
                }
                else
                {
                    test.ok(false, error);
                    test.done();
                }
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


exports.usingPhantomPage = NodeunitBuilder.createTestScopeExtender(
    "using phantom page",
    function(done) {

        var that = this;

        phantom
            .create()
            .then(function(phantom) {

                phantomRef = phantom;

                return phantom.createPage()
                    .then(function(page) {
                        that.page = page;

                        page.onConsoleMessage = function(message) {
                            console.log("phantomsjs console.log:", message);
                        };

                        page.onError = function(message) {
                            console.log("phantomjs error:", message);
                        };
    
                        that.promiseErrorHandlers = that.promiseErrorHandlers || [];
                        that.promiseErrorHandlers.push(function() {
                            var screenshotPath = path.resolve(".", "test-screenshot.jpg");
                            return that.page.render(screenshotPath)
                            .then(function(){
                                console.log("wrote screenshot to", screenshotPath);
                            }, function(renderError) {
                                console.log ("error writing screenshot:", renderError);
                            });
                        });
                    });
            })
            .then(function() {
                done();
            }, function(err) {
                done(err);
            });
    },
    function(done) {

        if (typeof phantomRef !== "undefined") {
            phantomRef.exit();
        }

        done();
    });


var server = require("../server/server.js");

exports.whenRunningTheServer = NodeunitBuilder.createTestScopeExtender(
    "when running the server",
    function(done) {

        // test setup can modify this.server.extraMiddleware to do extra prep

        this.server = {};
        this.server.extraMiddleware = function(req,res,next) {
            next();
        };

        var thisServerContext = this.server;

        server.start(config.get("server_port"), done, function(req, res, next) {
            thisServerContext.extraMiddleware(req,res,next);
        });
    },
    function(done) {
        server.stop(function()
        {
            done();
        });
    });

exports.givenCleanDatabase = NodeunitBuilder.createTestScopeExtender(
    "given a clean database",
    require("../server/database.js").emptyDatabase);

exports.givenSmtpServer = NodeunitBuilder.createTestScopeExtender(
    "given an SMTP server",
    function(done) {
        smtpServer = smtpTest.init(config.get("smtp_port"));
        this.smtpServer = smtpServer;
        done();
    },
    function(done) {

        smtpServer.stop();
        done();
    });


exports.given3rdPartyRssServer = NodeunitBuilder.createTestScopeExtender(
    "given a 3rd part RSS server",
    function(done) {

        var hostname = "127.0.0.76";
        var port = config.get("server_port");

        var thisRssServerContext = {
            feedName: "FeedForAll Sample Feed",
            posts: [ {
                    postName: "RSS Solutions for Restaurants",
                    postUrl: "http://www.feedforall.com/restaurant.htm",
                    postDate: "June 1, 2013"
                }
            ],
            urlFor : function(path) {
                return "http://" + hostname + ":" + port.toString() + path;
            }
        };

        var that = this;

        that.rssServer = thisRssServerContext;
        that.rssServer.requestCount = 0;

        var app = require('express')();
        app.get("/rss/*", function(req, res) {

            var feed = new RSS({
                    title: that.rssServer.feedName
                });

            that.rssServer.posts.forEach(function(post) {

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

        this.rssServer.server = http.createServer(app);

        this.rssServer.server.listen(port, hostname, done);

    },
    function(done) {
        this.rssServer.server.close(done);
    });


exports.getGoogleProfile = function(postfix) {
    return {
        displayName: 'displayName' + postfix + uuid(),
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

