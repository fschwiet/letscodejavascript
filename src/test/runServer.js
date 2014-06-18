var childProcess = require("child_process");
var fs = require("fs");
var assert = require("assert");
var config = require("../server/config.js");
var util = require("util");

var SCRIPT_NAME = "src/iis/iis_server.js";

var server = null;

exports.startServerLikeIIS = function(callback) {
    assert.ok(fs.existsSync(SCRIPT_NAME), "Could not find file " + SCRIPT_NAME);

    var env = JSON.parse(JSON.stringify(process.env));
    env.PORT = config.get("server_port");

    server = spawnOpenProcess("iis_server", "node", [SCRIPT_NAME], {
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
        server.on("exit", function() {
            callback();
        });

        server.stdin.write("done\n");

        server = null;
    } else {
        callback();
    }
};

function spawnOpenProcess(name, program, args, options) {

    console.log(util.format("running %s as %s %s", name, program, args.join(" ")));

    var result = childProcess.spawn(program, args, options);

    result.stdout.setEncoding('utf8');

    result.stderr.on('data', function(data) {
        data.toString().split("\n").forEach(function(line) {
            console.log(name + " stderr: " + line);
        });
    });

    result.stdout.on('data', function(data) {
        data.toString().split("\n").forEach(function(line) {
            console.log(name + " stdout: " + line);
        });
    });

    result.on('close', function(code) {
        console.log(util.format("%s finished with exit code %s", name, code));
    });

    return result;
}