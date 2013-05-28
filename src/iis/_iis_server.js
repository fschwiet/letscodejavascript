(function() {
    "use strict";

    var fs = require("fs");
    var assert = require("assert");
    var downloadFile = require("../test/download-file");
    var childProcess = require("child_process");

    var SCRIPT_NAME = "src/iis/iis_server.js";

    var server = null;

    exports.setUp = function(done) {

        assert.ok(fs.existsSync(SCRIPT_NAME), "Could not find file " + SCRIPT_NAME);

        var env = JSON.parse(JSON.stringify(process.env));
        env.PORT = 8081;

        server = childProcess.spawn("node", [SCRIPT_NAME], {
            env : env
        });

        server.stdout.setEncoding("utf8");

        server.stderr.on('data', function (data) {
            console.log(SCRIPT_NAME + ' stderr: ' + data);
        });

        server.stdout.on('data', function (data) {
            console.log(SCRIPT_NAME + " stdout: " + data);

            if (data.indexOf("Server started") !== -1) {
                done();
            }
        });
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

        downloadFile("http://localhost:8081", function(statusCode, responseBody) {
            test.ok(responseBody.indexOf("this is homepage.html") !== -1, "Should have marker indicating homepage");
            test.done();
        });
    };

    exports.test_canReportDatabaseStatus = function(test) {

        var expectedPattern = (/Database status:(.*)$/mi);

        downloadFile("http://localhost:8081/status", function(statusCode, responseBody) {
            
            var match = expectedPattern.exec(responseBody);

            test.ok(match !== null, "Did not find connection status string.");

            if (match !== null) {
                test.equal(match[1].trim(), "connected (localhost)");
            }
            test.done();
        });
    };
})();