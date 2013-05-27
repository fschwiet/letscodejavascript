var assert = require('assert');
var karma = require('./node_modules/karma/lib/runner.js');
var mysql = require('mysql');
var database = require("./src/server/database.js");
var childProcess = require("child_process");
var path = require("path");
var fs = require('fs.extra');
var rimraf = require("rimraf");
var util = require("util");
var Q = require("q");

function tracedTask(name) {
  console.log("\nExecuting " + name);
  return task.apply(this, arguments);
}

tracedTask("default", ["lint", "test"], function() {

});

desc("lint");
tracedTask("lint", function() {

  var list = new jake.FileList();
  list.include("**/*.js");
  list.exclude("node_modules");
  list.exclude("build");

  var runner = require("./build/lint/lint_runner.js");

  var a = runner.validateFileList(list);
  assert.ok(a, "lint failed");
});

desc("test everything");
tracedTask("test", ["testClient","testServer"]);

tracedTask("testServer", ["createTestDatabase"], function() {

  var testList = new jake.FileList();
  testList.include("**/_*.js");
  testList.exclude("node_modules");
  testList.exclude("build");
  testList.exclude("src/client/**");

  var reporter = require('nodeunit').reporters["default"];
  reporter.run(testList.toArray(), null, function(failures) {
    assert.ifError(failures);
    complete();
  });
}, {async: true});

tracedTask("testClient", function() {
  
  karma.run({}, function(exitCode) {

    assert.equal(exitCode, 0, "Karma test runner indicates failure.");

    complete();
  });
}, { async: true });

tracedTask("createTestDatabase", function() {
  
  database.ensureTestDatabaseIsClean(function(err) {
    assert.ifError(err);
    complete();
  });
}, { async:true});

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

  function spawn(name, program, args, options) {

    var deferred = Q.defer();

    console.log(util.format("running %s as %s %s", name, program, args.join(" ")));

    var spawnedProcess = childProcess.spawn(program, args, {
      cwd: workingDirectory,
    });

    spawnedProcess.stdout.setEncoding('utf8');

    spawnedProcess.stderr.on('data', function(data) { 
      console.log(name + " error: " + data.toString().trim().replace("\n", "---"));
      console.log(name + " error end");
    });

    spawnedProcess.stdout.on('data', function(data) {
      data.toString().split("\n").forEach(function(line) {
        console.log(name + " stdout: " + line);
      });
    });

    spawnedProcess.on('close', function(code) {
      if (code !== 0) {
        deferred.reject(new Error(name + " finished with errorcode " + code));
      } else {
        deferred.resolve();
      }
    });
    return deferred.promise;
  }

  spawn("git clone", "git", ["clone", "--quiet", "--no-hardlinks", originWorkingDirectory, workingDirectory])
  //spawn("gg", "git", ["--version"])
  .then(function() {
    return spawn("npm build", "node", [ path.resolve(workingDirectory, ".\\node_modules\\npm\\cli.js"), "rebuild"], {
      cwd: workingDirectory,
    });
  })
  .then(function() {
    fs.copy(path.resolve(originWorkingDirectory, "config.json"), path.resolve(workingDirectory, "config.json"));
  })
  .then(function() {
    return spawn("jake", "node", [ path.resolve(workingDirectory, ".\\node_modules\\jake\\bin\\cli.js"), "default"], {
      cwd: workingDirectory,
    });
  }, function(reason) {
    fail(reason);
  });

}, {async:true});

