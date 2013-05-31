

var phantom = require("./node-phantom-shim.js");

exports.qtest = function(context, name, promiseFilter) {
    context["test_" + name] = function(test) {

      promiseFilter = promiseFilter || function(promise) {
        promise.reject("not implemented");
        return promise;
      };

      promiseFilter()
        .then(
          function() {
            test.done();
          }, 
          function(err) {
            test.ifError(err || "promise failed for unknown reason"); 
            test.done();
          });
    };
};

//
//  Callback is passed 1 parameter, the phantom.js instance
//
exports.usingPhantom = function(callback) {
    return function() {
        return phantom.promise
        .create()
        .then(function(phantom) {
            console.log("ph.exit called");
            return callback(phantom).fin(function() {
                phantom.exit();
            });
        });
    };
};

exports.whenRunningTheServer = function(inner) {

    var fs = require("fs");
    var assert = require("assert");
    var downloadFile = require("../test/download-file");
    var spawnProcess = require("../test/spawn-process");

    var SCRIPT_NAME = "src/iis/iis_server.js";

    var server = null;

    inner.setUp = function(done) {

        assert.ok(fs.existsSync(SCRIPT_NAME), "Could not find file " + SCRIPT_NAME);

        var env = JSON.parse(JSON.stringify(process.env));
        env.PORT = 8081;

        server = spawnProcess.leftRunning("iis_server", "node", [SCRIPT_NAME], {
            env : env
        });

        server.stdout.on('data', function (data) {
            if (data.indexOf("Server started") !== -1) {
                done();
            }
        });
    };

    inner.tearDown = function(done) {
        
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
};
    