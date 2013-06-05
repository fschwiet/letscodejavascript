var nodeunit = require('nodeunit');
var assert = require('assert');
var karma = require('./build/karma/karma');
var mysql = require('mysql');
var database = require("./src/server/database.js");
var path = require("path");
var fs = require('fs.extra');
var rimraf = require("rimraf");
var spawnProcess = require("./src/test/spawn-process.js");
var childProcess = require("child_process");
var nconf = require("./src/server/config.js");

task = require("./build/jake-util.js").extendTask(task, jake);

task("default", ["lint", "writeSampleConfig", "test"], function() {

});

desc("lint");
task("lint", function() {

  var list = getFileListWithTypicalExcludes();
  list.include("**/*.js");

  var runner = require("./build/lint/lint_runner.js");

  var a = runner.validateFileList(list);
  assert.ok(a, "lint failed");
});

desc("write sample config file");
task("writeSampleConfig", function() {

  var defaults = nconf.getDefaults();

  fs.writeFileSync("./sample.config.json", JSON.stringify(defaults, null, "    "));
});

desc("test everything");
task("test", ["testClient","testTheRest", "testSlow"]);

task("testClient", function() {

  promiseJake(karma.runTests());

}, { async: true });

task("testTheRest", ["prepareTempDirectory", "createTestDatabase"], function() {

  var testList = getFileListWithTypicalExcludes();
  testList.include("**/_*.js");
  testList.exclude("src/client/**");
  testList.exclude("**/*.slow.js");

  var reporter = nodeunit.reporters["default"];
  reporter.run(testList.toArray(), null, function(failures) {
    assert.ifError(failures);
    complete();
  });
}, {async: true});

task("testSlow", ["prepareTempDirectory", "createTestDatabase"], function() {

  var testList = getFileListWithTypicalExcludes();
  testList.include("**/_*.slow.js");
  testList.exclude("src/client/**");

  var reporter = nodeunit.reporters["default"];
  reporter.run(testList.toArray(), null, function(failures) {
    assert.ifError(failures);
    complete();
  });
}, {async: true});

task("prepareTempDirectory", function() {
  var rmTarget = path.resolve("./temp");
  console.log("using temp directory " +  rmTarget);
  jake.rmRf(rmTarget);

  if (fs.existsSync(rmTarget))
  {
    fail("Unable to clear temp directory");
  }

  fs.mkdirSync("./temp");
  fs.mkdirSync("./temp/uploads");
});

task("createTestDatabase", function() {
  
  database.ensureTestDatabaseIsClean(function(err) {
    assert.ifError(err);
    complete();
  });
}, { async:true});

desc("Run the server locally");
task("runServer", function() {
  var port = 8083;
  console.log("running the server on", port);  
  var server = require("./src/server/server.js");
  server.start(port);
});

function cloneWithConfig(workingDirectory, configToUse) {
  return spawnProcess("git clone", "git", ["clone", "--quiet", "--no-hardlinks", ".", workingDirectory])
  .then(function() {
    return spawnProcess("npm build", "node", [ path.resolve(workingDirectory, "./node_modules/npm/cli.js"), "rebuild"], {
      cwd: workingDirectory,
    });
  })
  .then(function() {
    fs.copy(configToUse, path.resolve(workingDirectory, "config.json"));
  });
}

desc("test all the things");
task("testForRelease", ["prepareTempDirectory"], function() {
  
  var workingDirectory = path.resolve(".\\temp\\workingDirectory");

  fs.mkdirSync("./temp/workingDirectory");

  cloneWithConfig(workingDirectory, "./config.json")
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


desc("Verifies there are no uncommitted changes");
task("verifyEmptyGitStatus", function() {
  childProcess.exec("git status --porcelain", function(error, stdout, stderror) {
    if (error !== null) {
      fail("unable to verify no uncommitted changes -- " + error.toString());
    } else if (stdout.trim().length > 0) {
      fail("Working tree is not empty, git status was:\n" + stdout);
    } else if (stderror.trim().length > 0) {
      fail("Error verifying working tree is empty, error output was:\n" + stderror);
    } else {
      complete();
    }
  });
});


desc("Deploy to IIS");
task("releaseToIIS", ["testForRelease", "verifyEmptyGitStatus"], function() {

  fail("not finished");
});

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
      setTimeout(function() { fail(err);}, 0);
    });
}