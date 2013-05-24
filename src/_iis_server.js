(function() {
    "use strict";

    var testUtil = require("./test-util");
    var childProcess = require("child_process");

    var SCRIPT_NAME = "iis_server.js";

    var server = null;

    exports.setUp = function(done) {

        server = childProcess.spawn("node", ["./src/" + SCRIPT_NAME], {
            env : {
                PORT: 8081
            }
        });
        server.stdout.setEncoding("utf8");

        done();
    };

    exports.tearDown = function(done) {
        if (server !== null) {
            server.on("close", function() {
                done();
            });
            server.kill();
            server = null;
        } else {
            done();
        }
    };

    exports.test_canRunServer = function(test) {

        server.stderr.on('data', function (data) {
            console.log(SCRIPT_NAME + ' stderr: ' + data);
        });

        server.stdout.on('data', function (data) {
            console.log(SCRIPT_NAME + " stdout: " + data);

            if (data.indexOf("Server started") !== -1) {
                testUtil.downloadFile("http://localhost:8081", function(statusCode, responseBody) {
                    test.ok(responseBody.indexOf("this is homepage.html") !== -1, "Should have marker indicating homepage");
                    test.done();
                });
            }
        });
    };
})();