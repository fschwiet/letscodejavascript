(function() {
    "use strict";

    var setup = require("./setup");
    var request = require("request");

    setup.whenRunningTheServer(exports);

    exports.test_canRunServer = function(test) {

        request("http://localhost:8081", function(err, response, responseBody) {
            test.ifError(err);
            test.equal(response.statusCode, 200, "Expected 200 response code");
            test.ok(responseBody.indexOf("this is homepage.html") !== -1, "Should have marker indicating homepage");
            test.done();
        });
    };
})();