var fs = require("fs");
var assert = require("assert");
var spawnProcess = require("./spawn-process");
var config = require("../server/config.js");

var SCRIPT_NAME = "src/iis/iis_server.js";

var server = null;

exports.startServerLikeIIS = function(callback) {
    assert.ok(fs.existsSync(SCRIPT_NAME), "Could not find file " + SCRIPT_NAME);

    var env = JSON.parse(JSON.stringify(process.env));
    env.PORT = config.get("server_port");

    server = spawnProcess.leftRunning("iis_server", "node", [SCRIPT_NAME], {
            env: env
        });

    server.stdout.on('data', function(data) {
        if (data.indexOf("Server started") !== -1) {
            callback();
        }
    });
};

exports.stopServer = function(callback) {
    if (server !== null) {
        server.on("close", function() {
            callback();
        });
        server.kill();
        server = null;
    } else {
        callback();
    }
};