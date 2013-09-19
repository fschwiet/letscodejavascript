var Q = require("q");

module.exports = function(name, toBeEvaluated, msTimeout, msInterval) {

    if (typeof(msTimeout) == "undefined") {
        msTimeout = module.exports.defaultWait;
    }

    if (typeof(msInterval) == "undefined") {
        msInterval = 100;
    }

    var defer = Q.defer();

    if (typeof(name) !== 'string') {
        defer.reject("waitUntil expects a name string as first parameter");
        return defer.promise;
    }


    var endTime = new Date();
    endTime.setMilliseconds(msTimeout + endTime.getMilliseconds());

    var handleResult = null;
    var waitAndTry = null;

    handleResult = function(result) {
        if (!result) {

            if (new Date() > endTime) {
                defer.reject("timed out waiting until " + name);
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