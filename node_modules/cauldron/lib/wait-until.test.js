(function() {
    "use strict";

    var assert = require("assert");
    var Q = require("q");
    var waitUntil = require("./wait-until.js");
    var shouldFail = require("./should-fail.js");

    var NodeunitBuilder = require("./nodeunit-builder.js");

    var scope = new NodeunitBuilder(exports, "using NodeunitBuilder");

    scope.test("should accept no optional parameters", function() {
        return waitUntil("trurth", function() { return true; });
    });

    scope.test("should wait for evaluation to be true", function() {
        var waits = 0;

        return waitUntil("hi", function() {
            return ++waits >= 5;
        }, 500, 1).then(function() {
            assert.equal(waits, 5);
        });
    });

    scope.test("should wait for promise evaluation to be true", function() {
        var waits = 0;

        return waitUntil("hi", function() {

            var defer = Q.defer();

            defer.resolve(++waits >= 5);

            return defer.promise;
        }, 500, 1).then(function() {
            assert.equal(waits, 5);
        });
    });

    scope.test("should eventually fail if evaluation is false", function() {
        var attempts = 0;

        return shouldFail(function() {
            return waitUntil("hi", function() {
                attempts++;
                return false;
            }, 200);
        }, "timed out");
    });

    scope.test("should eventually fail if promise evaluation is false", function() {
        var attempts = 0;

        return shouldFail(function() {
            return waitUntil("hi", function() {

                attempts++;
                var deferred = Q.defer();
                deferred.resolve(false);
                return deferred.promise;
            }, 200);
        }, "timed out");
    });

    scope.test("given noTimeoutError is set, when timing out then should finish without error", function() {
        var attempts = 0;

        return waitUntil("hi", function() {

            attempts++;
            var deferred = Q.defer();
            deferred.resolve(false);
            return deferred.promise;
        }, {
            msTimeout: 200,
            noTimeoutError: true
        });
    });

    scope.test("should propagate synchronous exceptions", function() {
        var waits = 0;

        return shouldFail(function() {
            return waitUntil("hi", function() {
                if (++waits >= 5) {
                    throw new Error("foo fiddly pham");
                }
            }, 500, 1);
        }, "foo fiddly pham");
    });

    scope.test("should propagate asynchronous exceptions", function() {
        var waits = 0;

        return shouldFail(function() {
            return waitUntil("hi", function() {

                var deferred = Q.defer();

                if (++waits >= 5) {
                    deferred.reject(new Error("foo async fiddly pham"));
                } else {
                    deferred.resolve(false);
                }

                return deferred.promise;
            }, 500, 1);
        }, "foo async fiddly pham");
    });

    scope.test("should give helpful error when unexpected parameters", function() {

        return shouldFail(function(){

            return waitUntil(function() {
            });
        }, "waitUntil expects a name string as first parameter");
    });
    // should pass on errors, on first or later attempts
})();