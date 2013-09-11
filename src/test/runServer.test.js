(function() {
    "use strict";

    var config = require("../server/config");
    var request = require("request");
    var runServer = require("./runServer.js");

    exports.setUp = function(done) {
        runServer.startServerLikeIIS(done);
    };

    exports.tearDown = function(done) {
        runServer.stopServer(done);
    };
    
    exports.test_canRunServer = function(test) {

        var url = config.urlFor("/status");

        request(url, function(err, response, responseBody) {
            test.ifError(err);
            test.equal(response.statusCode, 200, "Expected 200 response code");
            test.ok(responseBody.indexOf("<title>Status</title>") !== -1, "Status page should have loaded");
            test.done();
        });
    };
})();