var childProcess = require("child_process");
var fs = require("fs");
var assert = require("assert");
var config = require("../server/config.js");
var util = require("util");

var SCRIPT_NAME = "src/server/runServer.js";

var server = null;

exports.startServerLikeProduction = function(callback) {

    assert.ok(fs.existsSync(SCRIPT_NAME), "Could not find file " + SCRIPT_NAME);

    server = spawnOpenProcess("runServer", "node", [SCRIPT_NAME]);

    server.stdout.on('data', function(data) {
        if (data.indexOf("Server started") !== -1) {
            callback();
        }
    });
};

exports.stopServer = function(callback) {

    if (server !== null) {
        server.on("exit", function() {
            callback();
        });

        server.stdin.write("done\n");

        server = null;
    } else {
        callback();
    }
};

function spawnOpenProcess(logName, program, args, options) {

    console.log(util.format("running %s as %s %s", logName, program, args.join(" ")));

    var result = childProcess.spawn(program, args, options);

    result.stdout.setEncoding('utf8');

    result.stderr.on('data', function(data) {
        data.toString().split("\n").forEach(function(line) {
            console.log(logName + " stderr: " + line);
        });
    });

    result.stdout.on('data', function(data) {
        data.toString().split("\n").forEach(function(line) {
            console.log(logName + " stdout: " + line);
        });
    });

    result.on('close', function(code) {
        console.log(util.format("%s finished with exit code %s", logName, code));
    });

    return result;
}