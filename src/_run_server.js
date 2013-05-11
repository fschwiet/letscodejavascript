(function() {
    "use strict";

    var testUtil = require("./test-util");
    var childProcess = require("child_process");

    var SCRIPT_NAME = "run_server.js";

    var server = null;

    exports.setUp = function(done) {

        server = childProcess.spawn("node", ["./src/" + SCRIPT_NAME, "8080"]);
        server.stdout.setEncoding("utf8");
        server.stderr.setEncoding("utf8");

        done();
    };

    exports.tearDown = function(done) {
        if (server !== null) {

            server.on("close", done);
            server.kill();
        }
    };

    exports.test_canRunServer = function(test) {

        server.stdout.on('data', function (data) {
            console.log(SCRIPT_NAME + " stdout: " + data);

            if (data.indexOf("Server started") !== -1) {
                testUtil.downloadFile("http://localhost:8080", function(statusCode, responseBody) {

                    test.ok(responseBody.indexOf("homepage marker") !== -1, "Should have marker indicating homepage");
                    test.done();
                });
            }
        });

        server.stderr.on('data', function (data) {
            console.log(SCRIPT_NAME + ' stderr: ' + data);
        });
    };
})();