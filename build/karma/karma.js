
var spawnProcess = require("./../../src/test/spawn-process");
var childProcess = require('child_process');

var karmaScript = "./node_modules/karma/bin/karma";
var phantomKarmaClientScript = "./build/karma/phantom-client";

exports.runServer = function() {
    var process = childProcess.spawn('node', [karmaScript, "start"], { detached: true, stdio: [ 'ignore', 'ignore', 'ignore' ] });
    process.unref();    
};

exports.runClient = function() {
    var process = childProcess.spawn('node', [phantomKarmaClientScript], { detached: true, stdio: [ 'ignore', 'ignore', 'ignore' ] });
    process.unref();    
};