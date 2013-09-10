(function() {

    "use strict";

    var config = require('./config.js');
    var server = require("./server.js");
    var request = require("request");

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

    exports.test_servesFileForHomepage = function(test) {

        server.start(port, function() {
            var url = config.urlFor("/");

            request(url, function(err, response, body) {

                test.ok(err === null, "Error: " + err);

                test.equal(response.statusCode, 200, "Expected 200 response code for url " + url);
                test.notEqual(-1, body.indexOf("<title>" + config.get("server_friendlyName") + "</title>"));

                server.stop(function() {
                    test.done();
                });
            });
        });
    };

    exports.test_has404Page = function(test) {

        server.start(port, function() {
            var url = config.urlFor("/non-existing");

            request(url, function(err, response, body) {

                test.ok(err === null, "Error: " + err);

                test.equal(response.statusCode, 404, "Expected 404 response code for url " + url);

                server.stop(function() {
                    test.done();
                });
            });
        });
    };

    exports.test_servesBuiltClientSide = function(test) {

        server.start(port, function() {
            var url = config.urlFor("/client/main-built.js");

            request(url, function(err, response, body) {

                test.ok(err === null, "Error: " + err);

                test.equal(response.statusCode, 200, "Expected 200 response code for url " + url);

                server.stop(function() {
                    test.done();
                });
            });
        });
    };

    exports["can compile jade views"] = function(test) {
        server.start(port, function() {
            var url = config.urlFor("/client/views/error500.jade.js");

            request(url, function(err, response, body) {

                test.ok(err === null, "Error: " + err);

                test.equal(response.statusCode, 200, "Expected 200 response code for url " + url);

                server.stop(function() {
                    test.done();
                });
            });
        });
    };

})();