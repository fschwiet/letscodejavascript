
var path = require('path');


function NodeunitBuilder(outer, name) {

    outer[name] = this;
}

NodeunitBuilder.prototype.withPromiseTest = function(name, callback) {

    this[name] = function(test) {

        var that = this;

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
                    errorHandler(that)
                    .fin(function() {
                        test.ok(false,err);
                        test.done();
                    });
                });
        }
    };    
};

function errorHandler(that) {
    if ("page" in that) {
        var screenshotPath = path.resolve(".", "test-screenshot.jpg");
        return that.page.render(screenshotPath)
        .then(function(){
            console.log("wrote screenshot to", screenshotPath);
        }, function(renderError) {
            console.log ("error writing screenshot:", renderError);
        });
    }
    else
    {
        return Q();
    }
}


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