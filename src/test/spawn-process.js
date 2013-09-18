var Q = require("q");
var util = require("util");
var childProcess = require("child_process");

module.exports = spawn;


function spawn(name, program, args, options) {

    options = JSON.parse(JSON.stringify(options || {}));
    options.stdio = "inherit";

    var process = childProcess.spawn(program, args, options);

    var deferred = Q.defer();

    process.on('exit', function(code) {
        if (code !== 0) {
            deferred.reject(new Error(name + " had non-zero exit code " + code));
        } else {
            deferred.resolve();
        }
    });

    return deferred.promise;
}