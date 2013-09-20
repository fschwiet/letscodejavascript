
var childProcess = require("child_process");
var fs = require("fs");
var path = require("path");
var Q = require("q");

var spawnProcess = require("./spawn-process.js");


function getGitCurrentCommit() {

    return Q()
    .then(function() {
        return Q.nfcall(childProcess.exec,"git rev-parse HEAD");
    })
    .then(function(revParseResults) {

        var stdout = revParseResults[0];
        var stderr = revParseResults[1];

        return stdout.toString().trim();
    });
}

function getAvailableDirectory(baseDirectory) {

    var index = 0;
    var result = null;

    do {
        ++index;
        result = baseDirectory + "_" + index;
    } while (fs.existsSync(result));

    return result;
}

function gitCloneTo(workingDirectory) {
    return spawnProcess("git", ["clone", "--quiet", "--no-hardlinks", ".", workingDirectory])
        .then(function() {
            return spawnProcess("node", [path.resolve(workingDirectory, "./node_modules/npm/cli.js"), "rebuild"], {
                    cwd: workingDirectory,
                });
        });
}

function verifyEmptyGitStatus() {

    return Q.nfcall(childProcess.exec, "git status --porcelain")
    .then(function(results){
        var stdout = results[0];
        var stderr = results[1];

        if (stdout.trim().length > 0) {
            throw new Error("Working tree is not empty, git status was:\n" + stdout);
        } else if (stderr.trim().length > 0) {
            throw new Error("Error verifying working tree is empty, error output was:\n" + stderr);
        }
    });
}


module.exports = {
    getGitCurrentCommit : getGitCurrentCommit,
    getAvailableDirectory: getAvailableDirectory,
    gitCloneTo: gitCloneTo,
    verifyEmptyGitStatus: verifyEmptyGitStatus
};