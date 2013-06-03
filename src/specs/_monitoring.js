(function() {
    "use strict";

    var setup = require("../test/setup");
    var downloadFile = require("../test/download-file");
    var nconf = require("../server/config.js");

    var port = nconf.get("testServer_port");

    setup.whenRunningTheServer(exports);

    exports.test_canReportDatabaseStatus = function(test) {

        var expectedPattern = (/Database status:(.*\(.*\))/mi);

        downloadFile("http://localhost:" + port + "/status", function(statusCode, responseBody) {
            
            var match = expectedPattern.exec(responseBody);

            test.ok(match !== null, "Did not find connection status string.");

            if (match !== null) {
                test.equal(match[1].trim(), "connected (localhost)");
            }
            test.done();
        });
    };
})();