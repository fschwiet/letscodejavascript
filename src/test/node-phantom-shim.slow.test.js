(function() {
    "use strict";

    var setup = require("../test/setup");
    var assert = require("assert");
    var express = require("express");
    var http = require('http');
    var Q = require("q");
    var config = require("../server/config.js");
    var waitUntil = require("./waitUntil.js");
    var assertPage = require("./assertPage.js");

    var app = express();
    var server;

    var port = config.get("server_port");

    exports.setUp = function(callback) {

        app.get("/empty", function(req, res) {
            res.send("<html><head><title>lol hmm</title></head><body>This page has no links.</body></html>");
        });

        app.get("/multiple", function(req, res) {
            res.send("<html><body><a class='target'></a><a class='target'></a></body></html>");
        });

        app.get("/links-to-empty", function(req, res) {
            res.send("<html><body><a class='target' href='/empty'>click me</a></body></html>");
        });

        app.get("/duplicate-links-to-empty", function(req, res) {
            res.send("<html><body><a class='target' href='/empty'>click me</a><a class='target' href='/empty'>click me</a></body></html>");
        });

        server = http.createServer(app);
        server.listen(port, function() {
            callback();
        });
    };

    exports.tearDown = function(callback) {
        if (server) {
            server.close(callback);
            server = null;
        } else {
            throw new Error("server was not started");
        }
    };

    var testBlock = setup.usingPhantomPage(exports);

    var clickElement = testBlock.clickElement = {};

    setup.qtest(testBlock, "should pass arguments to evaluate correctly", function() {

        return this.page.promise.evaluate(function(a, b, c) {
                return a + b + c;
            }, 1, 2, 3)
            .then(function(result) {
                assert.equal(result, 6);
            });
    });

    setup.qtest(testBlock, "should be able to load page content as a string", function() {

        var page = this.page;

        return page.promise.open(config.urlFor("/empty"))
            .then(function(status) {
                assert.equal(status, "success");
            })
            .then(function() {
                return assertPage.containsContent(page, "This page has no links");
            });
    });

    setup.qtest(clickElement, "should give useful error when not found", function() {

        var page;

        return setup.shouldFail(function() {
            return page.promise.open(config.urlFor("/empty"))
                .then(function(status) {
                    assert.equal(status, "success");
                })
                .then(function() {
                    return page.promise.clickElement("a.target");
                });
        }, "An element matching 'a.target' not found");
    });

    setup.qtest(clickElement, "should give useful error when multiple found", function() {

        var page = this.page;

        return setup.shouldFail(function() {
            return page.promise.open(config.urlFor("/multiple"))
                .then(function(status) {
                    assert.equal(status, "success");
                })
                .then(function() {
                    return page.promise.clickElement("a.target");
                });
        }, "More than one elements matching 'a.target' were found");
    });

    setup.qtest(clickElement, "should click element when found", function() {

        var page = this.page;

        return page.promise.open(config.urlFor("/links-to-empty"))
            .then(function(status) {
                assert.equal(status, "success");
            })
            .then(function() {
                return page.promise.clickElement("a.target");
            })
            .then(function() {
                var start = new Date();
                return waitUntil("browser is redirected to /empty", function() {
                    return page.promise.get("url").then(function(url) {
                        return url == config.urlFor("/empty");
                    });
                }, 1000);
            });
    });

    setup.qtest(clickElement, "should be able to click element found by evaluation", function() {

        var page = this.page;

        return page.promise.open(config.urlFor("/links-to-empty"))
            .then(function(status) {
                assert.equal(status, "success");
            })
            .then(function() {
                return page.promise.clickElement(function() {
                    return document.querySelectorAll("a.target");
                });
            })
            .then(function() {
                var start = new Date();
                return waitUntil("browser is redirected to /empty", function() {
                    return page.promise.get("url").then(function(url) {
                        console.log("url was", url);
                        return url == config.urlFor("/empty");
                    });
                }, 1000);
            });
    });

    setup.qtest(clickElement, "should allow less-strict clicking where uniqueness is not required", function() {

        var page = this.page;

        return page.promise.open(config.urlFor("/duplicate-links-to-empty"))
            .then(function(status) {
                assert.equal(status, "success");
            })
            .then(function() {
                return page.promise.clickElement("a.target", true);
            })
            .then(function() {
                var start = new Date();
                return waitUntil("browser is redirected to /empty", function() {
                    return page.promise.get("url").then(function(url) {
                        console.log("url was", url);
                        return url == config.urlFor("/empty");
                    });
                }, 1000);
            });
    });
})();