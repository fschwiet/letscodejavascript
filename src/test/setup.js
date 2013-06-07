

var phantom = require("./node-phantom-shim.js");
var Q = require('q');
var nconf = require("./../server/config.js");
var assert = require("assert");

exports.qtest = function(context, name, testImplementation) {
    context["test_" + name] = function(test) {

      testImplementation = testImplementation || function(promise) {
        promise.reject("not implemented");
        return promise;
      };

      testImplementation()
        .then(
          function() {
            test.done();
          }, 
          function(err) {
            test.ok(false, err);
            test.done();
          });
    };
};

exports.shouldFail = function(promiseFactory, expectedText) {

    return promiseFactory()
        .then(function() {
          throw new Error("Expected exception");
        }, 
        function(err) {
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
                    .fin(function() {
                        console.log("ph.exit called");
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

exports.whenRunningTheServer = function(inner) {

    inner.setUp = runServer.startServerLikeIIS;
    inner.tearDown = runServer.stopServer;
};
    