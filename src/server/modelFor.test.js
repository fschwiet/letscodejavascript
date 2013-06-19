(function() {

    "use strict";

    var modelFor = require("./modelFor");

    exports["standard model includes page title"] = function(test) {
        var expectedTitle = "abc ABC 123";
        var result = modelFor(expectedTitle, {});
        test.equal(result.title, expectedTitle);
        test.done();
    };

    exports["standard model includes isAuthenticated"] = function(test) {

        var authenticatedRequest = {};
        authenticatedRequest.user = {};

        var unathenticatedRequest = {};

        var authenticated = modelFor("", authenticatedRequest);
        var unauthenticated = modelFor("", unathenticatedRequest);

        test.equal(authenticated.isAuthenticated, true);
        test.equal(unauthenticated.isAuthenticated, false);
        test.done();
    };

    exports["standard model doesn't blow up if flash is unavailable"] = function(test) {

        var expectedFlash = {
            info: 'foo far baz'
        };

        var request = {
            flash: function() {
                return expectedFlash;
            }
        };

        var model = modelFor("", request);

        test.equal(JSON.stringify(model.flash), JSON.stringify(expectedFlash));
        test.done();
    };
})();