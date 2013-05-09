
(function()  {

    "use strict";

    var server = require("./server.js");
    var http = require("http");


    exports.test_earlyStopCallsAreOk = function(test) {
        server.stop();
        test.done();
    };

    exports.test_canListenForRequests = function(test) {

        server.start(8080);

        var result = http.get("http://localhost:8080", function(response) {
            test.equal(response.statusCode, 200, "Expected 200 response code");
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

        downloadFile(test, url, function(statusCode, body) {

            test.equal(statusCode, 200, "Expected 200 response code for url " + url);
            test.notEqual(-1, body.indexOf("This is a file"));

            server.stop();
            test.done();
        });
    };

    exports.test_has404Page = function(test) {

        server.start(8080);

        var url = "http://localhost:8080/non-existing";

        downloadFile(test, url, function(statusCode, body) {

            test.equal(statusCode, 404, "Expected 404 response code for url " + url);
            server.stop();
            test.done();
        });
    };

    function downloadFile(test, url, callback) {
        var result = http.get(url, function(response) {
            response.setEncoding("utf8");
            
            var responseBody = "";

            response.on("data",function(chunk) {
                responseBody += chunk;
            });

            response.on("end", function() {
                callback(response.statusCode, responseBody);
            });
        });
    }
})();
