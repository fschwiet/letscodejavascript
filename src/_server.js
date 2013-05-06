
"user strict";

var server = require("./server.js");
var http = require("http");


exports.test_earlyStopCallsAreOk = function(test) {
    server.stop();
    test.done();
};

exports.test_canListenForRequests = function(test) {

    server.start();

    var result = http.get("http://localhost:8080", function(response) {
        test.equal(response.statusCode, 200, "Expected 200 response code");
        server.stop(test.done);
    });
};

exports.test_extraStopCallsAreOk = function(test) {
    server.stop();
    test.done();
};