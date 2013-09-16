
function NodeunitBuilder() {

}

NodeunitBuilder.prototype.withPromiseTest = function(name, callback) {

    this[name] = function(test) {

        if (typeof callback !== "function") {
            test.ok(false, "Not implemented");
            test.done();
            return;
        }

        var result;

        try
        {
            result = callback.call(this);
        }
        catch(err) {
            test.ok(false, err);
            test.done();
            return;
        }
         

        if ( !result || typeof result.then !== 'function') {
            test.fail("withPromiseTest expects a function that returns a promise.");
            test.done();
        }
        else {
            result
                .then(function() {
                    test.done();
                }, function(err) {
                    test.ok(false, err);
                    test.done();
                });
        }
    };    
};


function createTestScopeExtender (name, setUp, tearDown) {

    return function(outer) {
        var inner = new NodeunitBuilder();
        outer[name] = inner;

        inner.setUp = setUp;
        inner.tearDown = tearDown;

        return inner;
    };
}

module.exports = NodeunitBuilder;
module.exports.createTestScopeExtender = createTestScopeExtender;