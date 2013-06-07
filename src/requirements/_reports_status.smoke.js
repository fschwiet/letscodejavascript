(function() {
    "use strict";

    var nconf = require("../server/config.js");
    var statusChecker = require("./statusChecker.js");
    var request = require("request");

    var hostname = nconf.get("smoketestServer_hostname");
    var port = nconf.get("testServer_port");

    exports.test_shouldReportIfConfigurationIsWorking = function(test) {

        request("http://"+hostname+":"+port+"/status", function(err, response, body){
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