var assert = require("assert");
var express = require("express");
var http = require('http');
var Q = require("q");
var config = require("../server/config.js");
var waitUntil = require("./waitUntil.js");
var assertPage = require("./assertPage.js");

var setup = require("../test/setup");
var NodeunitBuilder = require("../test/nodeunit-builder.js");
var server;

var port = config.get("server_port");

var withServer = new NodeunitBuilder(exports, "with sample server");

withServer.setUp = function(callback) {

    var app = express();

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

withServer.tearDown = function(callback) {
    if (server) {
        server.close(callback);
        server = null;
    } else {
        throw new Error("server was not started");
    }
};

var testBlock = setup.usingPhantomPage(withServer);
var clickElement = new NodeunitBuilder(testBlock, "using clickElement");

testBlock.withPromiseTest("should pass arguments to evaluate correctly", function() {

    var page = this.page;

    return page.evaluate(function(a, b, c) {
            return a + b + c;
        }, 1, 2, 3)
        .then(function(result) {
            assert.equal(result, 6);
        });
});

testBlock.withPromiseTest("should pass exception through with for evaluate", function() {

    var page = this.page;
    return setup.shouldFail(function() {
        return page.evaluate(function(a, b, c) {
            throw new Error("some error: " + (a + b + c));
        }, 1, 2, 3);
    }, "some error: 6");
});

testBlock.withPromiseTest("should be able to load page content as a string", function() {

    var page = this.page;

    return page.open(config.urlFor("/empty"))
        .then(function(status) {
            assert.equal(status, "success");
        })
        .then(function() {
            return assertPage.containsContent(page, "This page has no links");
        });
});

testBlock.withPromiseTest("should give useful error when not found", function() {

    var page = this.page;

    return setup.shouldFail(function() {
        return page.open(config.urlFor("/empty"))
            .then(function(status) {
                assert.equal(status, "success");
            })
            .then(function() {
                return page.clickElement("a.target");
            });
    }, "An element matching 'a.target' not found");
});

clickElement.withPromiseTest("should give useful error when multiple found", function() {

    var page = this.page;

    return setup.shouldFail(function() {
        return page.open(config.urlFor("/multiple"))
            .then(function(status) {
                assert.equal(status, "success");
            })
            .then(function() {
                return page.clickElement("a.target");
            });
    }, "More than one elements matching 'a.target' were found");
});

clickElement.withPromiseTest("should click element when found", function() {

    var page = this.page;

    return page.open(config.urlFor("/links-to-empty"))
        .then(function(status) {
            assert.equal(status, "success");
        })
        .then(function() {
            return page.clickElement("a.target");
        })
        .then(function() {
            return waitUntil("browser is redirected to /empty", function() {
                return page.get("url").then(function(url) {
                    return url == config.urlFor("/empty");
                });
            }, 1000);
        });
});

clickElement.withPromiseTest("should be able to click element found by evaluation", function() {

    var page = this.page;

    return page.open(config.urlFor("/links-to-empty"))
        .then(function(status) {
            assert.equal(status, "success");
        })
        .then(function() {
            return page.clickElement(function() {
                return document.querySelectorAll("a.target");
            });
        })
        .then(function() {
            return waitUntil("browser is redirected to /empty", function() {
                return page.get("url").then(function(url) {
                    console.log("url was", url);
                    return url == config.urlFor("/empty");
                });
            }, 1000);
        });
});

clickElement.withPromiseTest("should allow less-strict clicking where uniqueness is not required", function() {

    var page = this.page;

    return page.open(config.urlFor("/duplicate-links-to-empty"))
        .then(function(status) {
            assert.equal(status, "success");
        })
        .then(function() {
            return page.clickElement("a.target", true);
        })
        .then(function() {
            return waitUntil("browser is redirected to /empty", function() {
                return page.get("url").then(function(url) {
                    console.log("url was", url);
                    return url == config.urlFor("/empty");
                });
            }, 1000);
        });
});


testBlock.withPromiseTest("should be able to listen to console", function() {

    var page = this.page;

    return page.evaluate(function() {
            console.log('hi');
        })
        .then(function(result) {
            assert.equal(page.consoleMessages[0], 'hi');
        });
});


testBlock.withPromiseTest("should be able to listen to client errors", function() {

    var page = this.page;

    function assertExpectedResult(result) {
        assert.ok(page.errors.toString().indexOf("error message") > -1);
    }

    return page.evaluate(function() {
            throw new Error("error message");
        })
        .then(assertExpectedResult,assertExpectedResult);
});