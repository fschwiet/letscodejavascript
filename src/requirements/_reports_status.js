(function() {
    "use strict";

    var setup = require("../test/setup");
    var downloadFile = require("../test/download-file");
    var nconf = require("../server/config.js");
    var statusChecker = require("./statusChecker.js");

    var port = nconf.get("testServer_port");

    setup.whenRunningTheServer(exports);

    exports.test_shouldReportIfConfigurationIsWorking = function(test) {

        downloadFile("http://localhost:" + port + "/status", function(statusCode, responseBody) {
            
            statusChecker.assertStatusIsGood(responseBody);

            test.done();
        });
    };
})();