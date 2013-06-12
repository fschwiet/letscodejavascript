
var Q = require('q');
var karma = require('./../../node_modules/karma/lib/runner.js');
var spawnProcess = require("./../../src/test/spawn-process");
var childProcess = require('child_process');

var karmaScript = "./node_modules/karma/bin/karma";
var phantomKarmaClientScript = "./build/karma/phantom-client";

exports.runServer = function(configFile) {
    var process = childProcess.spawn('node', [karmaScript, "start", configFile], { detached: true, stdio: [ 'ignore', 'ignore', 'ignore' ] });
    process.unref();    
};

exports.runClient = function() {
    var process = childProcess.spawn('node', [phantomKarmaClientScript], { detached: true, stdio: [ 'ignore', 'ignore', 'ignore' ] });
    process.unref();    
};

exports.runTests = function(configFile) {

  var deferred = Q.defer();

  var testRunnerLocation = "http://localhost:9876/";

  console.log('running karma');

  var needServer = false;
  var triedServer = false;
  var originalConsoleError = console.error;

  var attempt = function() {

      console.error = function() {

        if (arguments.length > 0 && typeof arguments[0] === "string") {
          if (arguments[0].indexOf("There is no server listening") > -1) {
            needServer = true;
          }
        }
        return originalConsoleError.apply(this, arguments);
      };

      var dedupe = false;

      var options = {cmd: "run", configFile:configFile};

      karma.run(options, function(exitCode) {

        //  We're getting multiple failure callbacks per run()....
        if (dedupe) {
            return;
        }
        dedupe = true;

        console.error = originalConsoleError;

        if (exitCode !== 0) {

          if (needServer && !triedServer) {
            console.log("Starting karma server and client (and leaving them running)");
            exports.runServer(configFile);
            exports.runClient();
            triedServer = true;

            setTimeout(function() {
                attempt();
            }, 10000);
          } else {
            deferred.reject("Karma exit code was non-zero: " + exitCode);
          }
        } else {
          deferred.resolve();
        }
      });    
  };

  attempt();

  return deferred.promise;
}