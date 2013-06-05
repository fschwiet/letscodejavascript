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
var mkdirp = require('mkdirp');
var Q = require("q");

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

function gitCloneTo(workingDirectory) {
  return spawnProcess("git clone", "git", ["clone", "--quiet", "--no-hardlinks", ".", workingDirectory])
  .then(function() {
    return spawnProcess("npm build", "node", [ path.resolve(workingDirectory, "./node_modules/npm/cli.js"), "rebuild"], {
      cwd: workingDirectory,
    });
  });
}

desc("test all the things");
task("testForRelease", ["prepareTempDirectory"], function() {
  
  var workingDirectory = path.resolve(".\\temp\\workingDirectory");

  fs.mkdirSync("./temp/workingDirectory");

  gitCloneTo(workingDirectory)
  .then(function() {

    fs.copySync("./config.json", path.resolve(workingDirectory, "config.json"));

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
}, {async:true});


desc("Deploy to IIS");
task("releaseToIIS", [/* TODO, add back: "testForRelease", "verifyEmptyGitStatus"*/], function() {

  var productionConfig = "./production.config.json";

  if (!fs.existsSync(productionConfig)) {
    fail("Could not find file production.config.json, please create before deploying.  Consider using sample.config.json as a starting point.");
  }

  var deployRoot = "c:/inetpub/letscodejavascript";

  if (!fs.existsSync(deployRoot)) {
    fs.mkdirSync(deployRoot);
  }

  var countWithinDeployRoot = fs.readdirSync(deployRoot).length;

  if (countWithinDeployRoot > 256) {
    fail("Deploying to a full directory.  Please clean up " + deployRoot + " first.");
  }

  childProcess.exec("git rev-parse HEAD", function(error, stdout, stderr) {

    if (error !== null) {
      fail(error);

    } else {
      var id = stdout.toString().trim();

      var index = 0;
      var deployPath = null;
      var fileUploadPath = null;

      do {
        ++index;
        deployPath = path.resolve(deployRoot,  id + "_" + index);
        fileUploadPath = path.resolve(deployRoot,  id + "_" + index + "_uploads");
      } while(fs.existsSync(deployPath));

      mkdirp.sync(fileUploadPath);

      console.log("Deploying to " + deployPath);

      promiseJake(gitCloneTo(deployPath)
        .then(function() {
          return Q.nbind(fs.readFile)(productionConfig, { encoding:"utf8"});
        })
        .then(function(configValues) {
          configValues = JSON.parse(configValues);
          configValues.fileUpload_path = fileUploadPath;
          return Q.nbind(fs.writeFile)(path.resolve(deployPath, "config.json"), JSON.stringify(configValues, null, "    "));
        })
        .then(function() {
          console.log("calling execFile on ./src/iis/install.ps1");

          var iisPath = path.join(deployPath, "src/iis");
          
          return Q.nbind(childProcess.execFile)("powershell", ["-noprofile", "-file", "./src/iis/install.ps1", iisPath, fileUploadPath, "*"], {env:process.env});
        })
        .then(function(results){
          var stdout = results[0];
          var stderr = results[1];

          console.log("stdout:\n" + stdout.toString());

          if (stderr.trim().length > 0) {
            throw new Error("Have error output: " + stderr.toString());
          }

          complete();
        }));
    }
  });
}, { async : true});


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