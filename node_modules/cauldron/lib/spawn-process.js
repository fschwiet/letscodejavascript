var Q = require("q");
var util = require("util");
var childProcess = require("child_process");

module.exports = spawn;


function spawn(program, args, options) {

    options = JSON.parse(JSON.stringify(options || {}));
    options.stdio = "inherit";

    var process = childProcess.spawn(program, args, options);

    var deferred = Q.defer();

    process.on('exit', function(code) {
        if (code !== 0) {
            deferred.reject(new Error(program + " with parameters " + JSON.stringify(args,null,4) + " had non-zero exit code " + code));
        } else {
            deferred.resolve();
        }
    });

    return deferred.promise;
}