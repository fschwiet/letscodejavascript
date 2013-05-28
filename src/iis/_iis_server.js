(function() {
    "use strict";

    var setup = require("..\\test\\setup");

    exports = setup.whenRunningTheServer();

    exports.test_canRunServer = function(test) {

        downloadFile("http://localhost:8081", function(statusCode, responseBody) {
            test.ok(responseBody.indexOf("this is homepage.html") !== -1, "Should have marker indicating homepage");
            test.done();
        });
    };
})();