var assert = require('assert');
var karma = require('./node_modules/karma/lib/runner.js');

task("default", ["lint", "test"], function() {

});

desc("lint");

task("lint", function() {

  var list = new jake.FileList();
  list.include("**/*.js");
  list.exclude("node_modules");
  list.exclude("build");

  var runner = require("./build/lint/lint_runner.js");

  var a = runner.validateFileList(list);
  assert.ok(a, "lint failed");
});

desc("test everything");
// WARNING:  running client tests before server tests causes server tests to not finish
task("test", ["testServer","testClient"]);

task("testServer", function() {

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

task("testClient", function() {
  karma.run({});
});
