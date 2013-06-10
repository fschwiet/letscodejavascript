var Q = require("q");
var util = require("util");
var childProcess = require("child_process");

module.exports = spawn;
module.exports.leftRunning = spawnOpenProcess;

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

function spawn(name, program, args, options) {

    var deferred = Q.defer();

    var result = spawnOpenProcess(name, program, args, options);

    result.on('close', function(code) {
        if (code !== 0) {
            deferred.reject(new Error(name + " had non-zero exit code " + code));
        } else {
            deferred.resolve();
        }
    });

    return deferred.promise;
}