(function() {
    "use strict";

    var assert = require("assert");
    var fs = require('fs');
    var path = require('path');
    var request = require("request");
    var Q = require("q");

    var config = require("../config.js");
    var setup = require("../test/setup.js");

    function assertStatusIsGood(contents) {

        var expectedVersion = fs.readFileSync(path.resolve(__dirname, "../../.node-version"));

        checkStatus(contents, (/Node version: (.*)/mi), expectedVersion);
        checkStatus(contents, (/Database status:(.*)/mi), "connected (");
    }

    function checkStatus(contents, expectedPattern, expectedStatus) {
        var match = expectedPattern.exec(contents);

        assert.ok(match !== null, "Did not find " + expectedPattern.toString());

        if (match !== null) {
            assert.equal(match[1].trim().slice(0, expectedStatus.length), expectedStatus);
        }
    }

    var testBlock = setup.whenRunningTheServer(exports);
    
    testBlock.test("should report if /status page looks good", function(test) {

        var target = config.urlFor("/status");
        console.log("requesting status page at", target);

        return Q.nfcall(request, target)
        .then(function(callResults) {
            
            var response = callResults[0];
            var body = callResults[1];

            assert.equal(response.statusCode, 200);

            assertStatusIsGood(body);
        });
    });
})();