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

var NodeunitBuilder = require("cauldron").nodeunit;


exports.qtest = function(context, name, testImplementation) {

    NodeunitBuilder.prototype.test.call(context, name, testImplementation);
};


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

exports.usingPhantomPage = require("cauldron").usingPhantomPage;


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

