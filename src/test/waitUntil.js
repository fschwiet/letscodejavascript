

var Q = require("q");

module.exports = function(toBeEvaluated, msTimeout) {

    if (typeof(msTimeout) == "undefined") {
        msTimeout = 250;
    }

    var defer = Q.defer();
    var endTime = new Date();
    endTime.setMilliseconds(msTimeout + endTime.getMilliseconds());

    while(!toBeEvaluated()) {

        if (new Date() > endTime) {
            defer.reject("timed out");
            return defer.promise;
        }
    }

    defer.resolve();

    return defer.promise;
};