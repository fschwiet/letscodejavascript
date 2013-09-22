
var path = require('path');
var Q = require('q');


function addTest(scope, name, callback) {
    scope[name] = function(test) {

        var that = this;

        if (typeof callback !== "function") {
            test.ok(false, "Not implemented");
            test.done();
            return;
        }

        Q()
        .then(function() {
            return callback.call(that);
        })
        .then(function() {
            test.done();
        }, function(err) {
            that.promiseErrorHandlers = that.promiseErrorHandlers || [];
            that.promiseErrorHandlers.reduce(Q.when, Q())
            .fin(function() {
                test.ok(false,err);
                test.done();
            });
        });
    };    
}


function NodeunitBuilder(outer, name) {

    outer[name] = this;
}

NodeunitBuilder.prototype.test = function(name, callback) {

    addTest(this,name,callback);
};


function createTestScopeExtender (name, setUp, tearDown) {

    return function(outer) {
        var inner = new NodeunitBuilder(outer, name);

        inner.setUp = setUp;
        inner.tearDown = tearDown;

        return inner;
    };
}

module.exports = NodeunitBuilder;
module.exports.createTestScopeExtender = createTestScopeExtender;
module.exports.addTest = addTest;