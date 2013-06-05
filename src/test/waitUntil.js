

var Q = require("q");

module.exports = function(toBeEvaluated, msTimeout, msInterval) {

    if (typeof(msTimeout) == "undefined") {
        msTimeout = 250;
    }

    if (typeof(msInterval) == "undefined") {
        msInterval = 100;
    }

    var defer = Q.defer();
    var endTime = new Date();
    endTime.setMilliseconds(msTimeout + endTime.getMilliseconds());

    var handleResult = null;
    var waitAndTry = null;

    handleResult = function(result) {
        if(!result) {

            if (new Date() > endTime) {
                defer.reject("timed out");
            }
            else 
            {
                return waitAndTry();
            }
        }
        else
        {
            defer.resolve();
        }
    };

    waitAndTry = function() {
        setTimeout(function() {

            var evaluationResult;

            try
            {
                evaluationResult = toBeEvaluated();
            }
            catch(err) {
                defer.reject(err);
                return;
            }

            if (typeof evaluationResult !== 'undefined' && evaluationResult !== null && typeof evaluationResult.then == "function") {

                evaluationResult.then(handleResult, 
                    function(err) { 
                        defer.reject(err);
                    });
            }
            else 
            {
                handleResult(evaluationResult);
            }
        }, msInterval);
    };

    waitAndTry();

    return defer.promise;
};