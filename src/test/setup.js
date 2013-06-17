var Q = require('q');
var assert = require("assert");
var path = require("path");

var nconf = require("./../server/config.js");
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

