(function() {
    "use strict";

    var setup = require("./setup");
    var config = require("../server/config");
    var request = require("request");

    var testBlock = setup.whenRunningTheServer(exports);

    var url = config.urlFor("/");

    testBlock.test_canRunServer = function(test) {

        request(url, function(err, response, responseBody) {
            test.ifError(err);
            test.equal(response.statusCode, 200, "Expected 200 response code");
            test.ok(responseBody.indexOf("<title>homepage</title>") !== -1, "Should have marker indicating homepage");
            test.done();
        });
    };
})();