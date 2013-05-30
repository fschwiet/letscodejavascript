var nodeunit = require('nodeunit');
var assert = require('assert');
var karma = require('./node_modules/karma/lib/runner.js');
var mysql = require('mysql');
var database = require("./src/server/database.js");
var path = require("path");
var fs = require('fs.extra');
var rimraf = require("rimraf");
var spawnProcess = require("./src/test/spawn-process.js");
var phantom = require("./src/test/node-phantom-shim");
var Q = require("q");

var taskRuntimes = [];

function tracedTask(name) {
  var result = task.apply(this, arguments);
  var start;

  result.addListener('start', function() {
    console.log("\nExecuting " + name);
    start = new Date().getTime();
  });

  result.addListener('complete', function() {
    taskRuntimes.push({task:name, ms:new Date().getTime() - start});
  });

  return result;
}

jake.addListener('complete', function() {
  console.log("Execution time summary");
  taskRuntimes.forEach(function(value) {
    console.log("  " + value.task + " (" + value.ms + "ms)");
  });
});

tracedTask("default", ["lint", "test"], function() {

});

desc("lint");
tracedTask("lint", function() {

  var list = getFileListWithTypicalExcludes();
  list.include("**/*.js");

  var runner = require("./build/lint/lint_runner.js");

  var a = runner.validateFileList(list);
  assert.ok(a, "lint failed");
});

desc("test everything");
tracedTask("test", ["testClient","testServer"]);

tracedTask("testServer", ["createTestDatabase"], function() {

  var testList = getFileListWithTypicalExcludes();
  testList.include("**/_*.js");
  testList.exclude("src/client/**");

  var reporter = nodeunit.reporters["default"];
  reporter.run(testList.toArray(), null, function(failures) {
    assert.ifError(failures);
    complete();
  });
}, {async: true});

tracedTask("testClient", function() {

  var testRunnerLocation = "http://localhost:9876/";

  promiseJake(phantom.promise.create()
    .then(function(ph) {
      return ph.promise.createPage().then(function(page) {
        
        console.log("calling open");
        return page.promise.open(testRunnerLocation)
          .then(function(status) {

            if (status !== "success")
            {
              throw new Error("Status loading karma test runner was non-success: " + status);
            }
          })
          .then(function() { 

            console.log("calling run");
            var deferred = Q.defer();

            console.log('running karma');
            karma.run({}, function(exitCode) {
              console.log('karma was ', exitCode);

              if (exitCode !== 0) {
                deferred.reject("Karma exit code was non-zero: " + exitCode);
              } else {
                deferred.resolve();
              }
            });

            return deferred.promise;
          });
      })
      .fin(function() {
        console.log("ph.exit called");
        ph.exit();
      });
    }));

}, { async: true });

tracedTask("createTestDatabase", function() {
  
  database.ensureTestDatabaseIsClean(function(err) {
    assert.ifError(err);
    complete();
  });
}, { async:true});

desc("Run the server locally");
tracedTask("runServer", function() {
  console.log("running the server on 8080");
  var server = require("./src/server/server.js");
  server.start(8080);
});

desc("test all the things");
tracedTask("testForRelease", function() {
  
  var originWorkingDirectory = path.resolve(".");
  var workingDirectory = path.resolve(".\\temp\\workingDirectory");

  var rmTarget = path.resolve(".\\temp");
  console.log("using temp directory " +  rmTarget);
  jake.rmRf(rmTarget);

  if (fs.existsSync(rmTarget))
  {
    fail("Unable to clear temp directory");
  }

  fs.mkdirSync(".\\temp");
  fs.mkdirSync(".\\temp\\workingDirectory");

  spawnProcess("git clone", "git", ["clone", "--quiet", "--no-hardlinks", originWorkingDirectory, workingDirectory])
  .then(function() {
    return spawnProcess("npm build", "node", [ path.resolve(workingDirectory, ".\\node_modules\\npm\\cli.js"), "rebuild"], {
      cwd: workingDirectory,
    });
  })
  .then(function() {
    fs.copy(path.resolve(originWorkingDirectory, "config.json"), path.resolve(workingDirectory, "config.json"));
  })
  .then(function() {
    return spawnProcess("jake", "node", [ path.resolve(workingDirectory, ".\\node_modules\\jake\\bin\\cli.js"), "default"], {
      cwd: workingDirectory,
    });
  })
  .then(function() {
    console.log("success!");
      complete();
    }, 
    function(reason) {
      console.log("failure!");
      console.log("calling fail with parameter" + reason);
      fail(reason);
  });

}, {async:true});

function getFileListWithTypicalExcludes() {
  var list = new jake.FileList();
  list.exclude("node_modules");
  list.exclude("build");
  list.exclude("temp");
  return list;
}

function promiseJake(promise) {
  return promise.then(
    function() {
      complete();
    }, 
    function(err) {
      fail(err.toString());
    });
}