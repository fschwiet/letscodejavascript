(function() {

    "use strict";

    var modelFor = require("./modelFor");

    function fakeRequest() {
        return {
            flash : function() { return {}; }
        };
    }

    exports.test_standard_model_includes_page_title = function(test) {
        var expectedTitle = "abc ABC 123";
        var result = modelFor(expectedTitle, fakeRequest());
        test.equal(result.title, expectedTitle);
        test.done();
    };

    exports.test_standard_model_includes_isAuthenticated = function(test) {

        var authenticatedRequest = fakeRequest();
        authenticatedRequest.user = {};

        var unathenticatedRequest = fakeRequest();

        var authenticated = modelFor("", authenticatedRequest);
        var unauthenticated = modelFor("", unathenticatedRequest);

        test.equal(authenticated.isAuthenticated, true);
        test.equal(unauthenticated.isAuthenticated, false);
        test.done();
    };
})();