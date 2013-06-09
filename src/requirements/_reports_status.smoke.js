(function() {
    "use strict";

    var config = require("../server/config.js");
    var statusChecker = require("./statusChecker.js");
    var request = require("request");

    exports.test_shouldReportIfConfigurationIsWorking = function(test) {

        var target = config.urlFor("/status");
        console.log("requesting status page at", target);

        request(target, function(err, response, body){
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