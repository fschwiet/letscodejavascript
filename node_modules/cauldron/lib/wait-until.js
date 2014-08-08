var Q = require("q");

module.exports = function(name, toBeEvaluated, options, legacyParameter) {

    var defer = Q.defer();

    if (typeof(name) !== 'string') {
        defer.reject("waitUntil expects a name string as first parameter");
        return defer.promise;
    }

    var msTimeout;
    var msInterval;
    var noTimeoutError = false;

    if (typeof(options) == 'number') {
        msTimeout = options;
        msInterval = legacyParameter;
    } else if (typeof(options) != "undefined") {
        msTimeout = options.msTimeout;
        msInterval = options.msInterval;
        noTimeoutError = options.noTimeoutError;
    }

    if (typeof(msTimeout) == "undefined") {
        msTimeout = module.exports.defaultWait;
    }

    if (typeof(msInterval) == "undefined") {
        msInterval = 100;
    }

    var endTime = new Date();
    endTime.setMilliseconds(msTimeout + endTime.getMilliseconds());

    var handleResult = null;
    var waitAndTry = null;

    handleResult = function(result) {
        if (!result) {

            if (new Date() > endTime) {
                if (noTimeoutError) {
                    defer.resolve();
                } else {
                    defer.reject("timed out waiting until " + name);
                }
            } else {
                return waitAndTry();
            }
        } else {
            defer.resolve();
        }
    };

    waitAndTry = function() {
        setTimeout(function() {

            var evaluationResult;

            try {
                evaluationResult = toBeEvaluated();
            } catch (err) {
                defer.reject(err);
                return;
            }

            if (typeof evaluationResult !== 'undefined' && evaluationResult !== null && typeof evaluationResult.then == "function") {

                evaluationResult.then(handleResult, function(err) {
                    defer.reject(err);
                });
            } else {
                handleResult(evaluationResult);
            }
        }, msInterval);
    };

    waitAndTry();

    return defer.promise;
};

module.exports.defaultWait = 250;