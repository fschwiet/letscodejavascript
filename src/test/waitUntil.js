

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

    var waitAndTry = function() {
        setTimeout(function() {
            while(!toBeEvaluated()) {

                if (new Date() > endTime) {
                    defer.reject("timed out");
                    return defer.promise;
                }
            }

            defer.resolve();
        }, msInterval);
    };

    waitAndTry();

    return defer.promise;
};