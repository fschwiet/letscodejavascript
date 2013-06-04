(function() {
    "use strict";

    var setup = require("../test/setup");
    var downloadFile = require("../test/download-file");
    var nconf = require("../server/config.js");

    var port = nconf.get("testServer_port");

    setup.whenRunningTheServer(exports);

    exports.test_shouldReportDatabaseStatus = function(test) {

        downloadFile("http://localhost:" + port + "/status", function(statusCode, responseBody) {
            
            function checkStatus(expectedPattern, expectedStatus){
                var match = expectedPattern.exec(responseBody);

                test.ok(match !== null, "Did not find " + expectedPattern.toString());

                if (match !== null) {
                    test.equal(match[1].trim(), expectedStatus);
                }
            }

            checkStatus((/Database status:(.*\(.*\))/mi), "connected (localhost)");
            checkStatus((/Upload path status:(.*\(.*\))/mi), "writeable");

            test.done();
        });
    };
})();