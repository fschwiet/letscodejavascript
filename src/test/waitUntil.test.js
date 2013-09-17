(function() {
    "use strict";

    var assert = require("assert");
    var Q = require("q");
    var setup = require("./setup.js");
    var waitUntil = require("./waitUntil.js");
    var shouldFail = require("./should-fail.js");

    setup.qtest(exports, "should wait for evaluation to be true", function() {
        var waits = 0;

        return waitUntil("hi", function() {
            return ++waits >= 5;
        }, 500, 1).then(function() {
            assert.equal(waits, 5);
        });
    });

    setup.qtest(exports, "should wait for promise evaluation to be true", function() {
        var waits = 0;

        return waitUntil("hi", function() {

            var defer = Q.defer();

            defer.resolve(++waits >= 5);

            return defer.promise;
        }, 500, 1).then(function() {
            assert.equal(waits, 5);
        });
    });

    setup.qtest(exports, "should eventually fail if evaluation is false", function() {
        var attempts = 0;

        return shouldFail(function() {
            return waitUntil("hi", function() {
                attempts++;
                return false;
            }, 200);
        }, "timed out");
    });

    setup.qtest(exports, "should eventually fail if promise evaluation is false", function() {
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

    setup.qtest(exports, "should propagate synchronous exceptions", function() {
        var waits = 0;

        return shouldFail(function() {
            return waitUntil("hi", function() {
                if (++waits >= 5) {
                    throw new Error("foo fiddly pham");
                }
            }, 500, 1);
        }, "foo fiddly pham");
    });

    setup.qtest(exports, "should propagate asynchronous exceptions", function() {
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

    setup.qtest(exports, "should give helpful error when unexpected parameters", function() {

        return shouldFail(function(){

            return waitUntil(function() {
            });
        }, "waitUntil expects a name string as first parameter");
    });
    // should pass on errors, on first or later attempts
})();