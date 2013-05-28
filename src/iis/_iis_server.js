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

    exports.test_canReportDatabaseStatus = function(test) {

        var expectedPattern = (/Database status:(.*)$/mi);

        downloadFile("http://localhost:8081/status", function(statusCode, responseBody) {
            
            var match = expectedPattern.exec(responseBody);

            test.ok(match !== null, "Did not find connection status string.");

            if (match !== null) {
                test.equal(match[1].trim(), "connected (localhost)");
            }
            test.done();
        });
    };
})();