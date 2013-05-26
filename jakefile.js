var assert = require('assert');
var karma = require('./node_modules/karma/lib/runner.js');
var mysql = require('mysql');
var database = require("./src/server/database.js");

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
