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

        if (config.get("useVagrantHost")) {
            done();
        } else {
            server.start(config.get("server_port"), done);
        }
    },
    function(done) {
        if (config.get("useVagrantHost")) {
            done();
        } else {
            server.stop(function()
            {
                done();
            });
        }
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

        var hostname = config.get("fakeServer_hostName");
        var port = config.get("fakeServer_port");

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

        app.get("/", function(req,res) {
            res.send("Fake RSS OK");
        });

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

        app.get("/html/:rest", function(req,res) {

            var rssUrl = "/rss/" + req.params.rest;

            res.send("<html><body><link id='AtomLink' title'RSS' type='application/rss+xml' rel='alternate' href='" + rssUrl + "'></body><html>");
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


exports.getGoogleProfile = function(userId, postfix) {
    return {
        id: userId,
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

