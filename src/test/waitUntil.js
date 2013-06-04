

var Q = require("q");

module.exports = function(toBeEvaluated) {

    var defer = Q.defer();

    while(!toBeEvaluated()) {

    }

    defer.resolve();

    return defer.promise;
};