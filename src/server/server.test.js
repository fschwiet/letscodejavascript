(function() {

    "use strict";

    var nconf = require('./config.js');
    var server = require("./server.js");
    var request = require("request");

    var port = nconf.get("server_port");


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
            var url = nconf.urlFor("/");

            request(url, function(err, response, body) {

                test.ok(err === null, "Error: " + err);

                test.equal(response.statusCode, 200, "Expected 200 response code for url " + url);
                test.notEqual(-1, body.indexOf("<title>homepage</title>"));

                server.stop(function() {
                    test.done();
                });
            });
        });
    };

    exports.test_has404Page = function(test) {

        server.start(port, function() {
            var url = nconf.urlFor("/non-existing");

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
            var url = nconf.urlFor("/client/main-built.js");

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
            var url = nconf.urlFor("/client/views/error500.jade.js");

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