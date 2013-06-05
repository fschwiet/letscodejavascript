(function() {
    "use strict";

    var setup = require("../test/setup");
    var downloadFile = require("../test/download-file");
    var nconf = require("../server/config.js");
    var statusChecker = require("./statusChecker.js");
    var request = require("request");

    var port = nconf.get("testServer_port");

    setup.whenRunningTheServer(exports);

    exports.test_shouldReportIfConfigurationIsWorking = function(test) {

        request("http://localhost:" + port + "/status", function(err, response, body){

            if (err !== null) {
                test.ok(false, err.toString());
            } else if (response.statusCode != 200) {
                test.ok(false, "Expected 200 status code, actually was " + response.statusCode);
            } else {
                statusChecker.assertStatusIsGood(body);
            }
            test.done();
        });
    };
})();