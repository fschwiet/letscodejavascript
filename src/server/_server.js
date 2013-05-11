
(function()  {

    "use strict";

    var server = require("./server.js");

    var testUtil = require("../test-util");


    exports.test_earlyStopCallsAreOk = function(test) {
        server.stop();
        test.done();
    };

    exports.test_canListenForRequests = function(test) {

        server.start(8080);

        testUtil.downloadFile("http://localhost:8080", function(statusCode, responseBody) {
            test.equal(statusCode, 200, "Expected 200 response code");
            server.stop(test.done);
        });
    };

    exports.test_extraStopCallsAreOk = function(test) {
        server.stop();
        test.done();
    };

    exports.test_canServeFile = function(test) {

        server.start(8080);

        var url = "http://localhost:8080/file.html";

        testUtil.downloadFile(url, function(statusCode, body) {

            test.equal(statusCode, 200, "Expected 200 response code for url " + url);
            test.notEqual(-1, body.indexOf("This is a file"));

            server.stop();
            test.done();
        });
    };

    exports.test_has404Page = function(test) {

        server.start(8080);

        var url = "http://localhost:8080/non-existing";

        testUtil.downloadFile(url, function(statusCode, body) {

            test.equal(statusCode, 404, "Expected 404 response code for url " + url);
            server.stop();
            test.done();
        });
    };
})();
