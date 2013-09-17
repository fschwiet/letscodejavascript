
var assert = require('assert');
var Q = require('q');

module.exports = function(method, expectedText) {

    return Q()
        .then(method)
        .then(function() {
            throw new Error("Expected exception");
        }, function(err) {
            if (expectedText) {
                assert.ok(err.toString().indexOf(expectedText) > -1,
                    "Did not see expected error text :" + expectedText + "\nActual text was " + err.toString());
            }
        });
};