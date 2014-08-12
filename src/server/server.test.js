var assert = require("assert");
var Q = require("q");
var request = require("request");

var config = require('../config.js');
var server = require("./server.js");

var setup = require("../test/setup.js");

var port = config.get("server_port");

exports.test_earlyStopCallsAreOk = function(test) {
    server.stop(function() {
        test.done();
    });
};

exports.test_extraStopCallsAreOk = function(test) {
    server.stop(function() {});
    server.stop(function() {});
    server.stop(function() {});
    server.stop(function() {
        test.done();
    });
};

var context = setup.whenRunningTheServer(exports);

context.test("has 404 page", function() {

    return Q()
    .then(function() {
        var url = config.urlFor("/non-existing");

        return Q.nfcall(request, url)
        .then(function(results) {
            var response = results[0];
            var body = results[1];

            assert.equal(response.statusCode, 404, "Expected 404 response code for url " + url);

            return Q.ninvoke(server, "stop");
        });
    });
});

context.test("serves client-side bundle", function() {

    return Q()
    .then(function() {
        var url = config.urlFor("/client/main-built.js");

        return Q.nfcall(request, url)
        .then(function(results) {
            var response = results[0];
            var body = results[1];

            assert.equal(response.statusCode, 200, "Expected 200 response code for url " + url);

            return Q.ninvoke(server, "stop");
        });
    });
});

context.test("can compile jade views", function() {

    return Q()
    .then(function() {
        var url = config.urlFor("/client/views/error500.jade.js");

        return Q.nfcall(request, url)
        .then(function(results) {
            var response = results[0];
            var body = results[1];

            assert.equal(response.statusCode, 200, "Expected 200 response code for url " + url);

            return Q.ninvoke(server, "stop");
        });
    });
});
