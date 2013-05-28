
(function()  {

    "use strict";

    var server = require("./server.js");

    var downloadFile = require("../test/download-file");


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

        server.start(8080, function() {
            var url = "http://localhost:8080/";

            downloadFile(url, function(statusCode, body) {

                test.equal(statusCode, 200, "Expected 200 response code for url " + url);
                test.notEqual(-1, body.indexOf("this is homepage.html"));

                server.stop();
                test.done();
            });
        });
    };

    exports.test_has404Page = function(test) {

        server.start(8080, function() {
            var url = "http://localhost:8080/non-existing";

            downloadFile(url, function(statusCode, body) {

                test.equal(statusCode, 404, "Expected 404 response code for url " + url);
                server.stop();
                test.done();
            });
        });
    };
})();
