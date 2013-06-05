
(function()  {

    "use strict";

    var nconf = require('./config.js');
    var server = require("./server.js");
    var request = require("request");

    var port = nconf.get("testServer_port");


    exports.test_earlyStopCallsAreOk = function(test) {
        server.stop();
        test.done();
    };

    exports.test_extraStopCallsAreOk = function(test) {
        server.stop();
        server.stop();
        server.stop();
        test.done();
    };

    exports.test_servesFileForHomepage = function(test) {

        server.start(port, function() {
            var url = "http://localhost:" + port + "/";

            request(url, function(err, response, body) {

                test.ok(err === null, "Error: " + err);

                test.equal(response.statusCode, 200, "Expected 200 response code for url " + url);
                test.notEqual(-1, body.indexOf("this is homepage.html"));

                server.stop();
                test.done();
            });
        });
    };

    exports.test_has404Page = function(test) {

        server.start(port, function() {
            var url = "http://localhost:" + port + "/non-existing";

            request(url, function(err, response, body) {

                test.ok(err === null, "Error: " + err);

                test.equal(response.statusCode, 404, "Expected 404 response code for url " + url);
                server.stop();
                test.done();
            });
        });
    };
})();
