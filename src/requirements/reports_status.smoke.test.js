(function() {
    "use strict";

    var assert = require("assert");
    var fs = require('fs');
    var path = require('path');
    var request = require("request");
    var Q = require("q");

    var config = require("../config.js");
    var setup = require("../test/setup.js");

    var context = setup.whenRunningTheServer(exports);
    
    context.test("should report if /status page looks good", function(test) {

        var expectedVersion = fs.readFileSync(path.resolve(__dirname, "../../.node-version"), 'utf8');

        var target = config.urlFor("/status");
        console.log("requesting status page at", target);

        return Q.nfcall(request, target)
        .then(function(callResults) {
            
            var response = callResults[0];
            var body = callResults[1];

            assert.equal(response.statusCode, 200);

            var status = JSON.parse(body);

            assert.equal(status.nodeVersion, expectedVersion);
            assert.equal(status.databaseStatus.substring(0,9), "connected", 
                "Expected status '" + status.databaseStatus + "' to start with connected.");
        });
    });
})();