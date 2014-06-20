(function() {
    "use strict";

    var config = require("../server/config.js");
    var request = require("request");
    var assert = require("assert");

    function assertStatusIsGood(contents) {
        checkStatus(contents, (/Database status:(.*)/mi), "connected (localhost)");
    }

    function checkStatus(contents, expectedPattern, expectedStatus) {
        var match = expectedPattern.exec(contents);

        assert.ok(match !== null, "Did not find " + expectedPattern.toString());

        if (match !== null) {
            assert.equal(match[1].trim(), expectedStatus);
        }
    }

    exports["should report if /status page looks good"] = function(test) {

        var target = config.urlFor("/status");
        console.log("requesting status page at", target);

        request(target, function(err, response, body) {
            if (err !== null) {
                test.ok(false, err.toString());
            } else if (response.statusCode != 200) {
                test.ok(false, "Expected 200 status code, actually was " + response.statusCode);
            } else {
                assertStatusIsGood(body);
            }
            test.done();
        });
    };
})();