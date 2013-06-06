
(function()  {

    "use strict";

    var model = require("./model");

    exports.test_standard_model_includes_page_title = function(test) {
        var expectedTitle = "abc ABC 123";
        var result = model.standard(expectedTitle, {});
        test.equal(result.title, expectedTitle);
        test.done();
    };

    exports.test_standard_model_includes_isAuthenticated = function(test) {
        
        var authenticatedRequest = {
            deserializeUser : {}
        };

        var unathenticatedRequest = {
        };
        
        var authenticated = model.standard("", authenticatedRequest);
        var unauthenticated = model.standard("", unathenticatedRequest);

        test.equal(authenticated.isAuthenticated, true);
        test.equal(unauthenticated.isAuthenticated, false);
        test.done();
    };
})();