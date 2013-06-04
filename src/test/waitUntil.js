

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

    var waitAndTry = null;

    waitAndTry = function() {
        setTimeout(function() {
            if(!toBeEvaluated()) {

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
        }, msInterval);
    };

    waitAndTry();

    return defer.promise;
};