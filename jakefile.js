var assert = require('assert');

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

task("test", function() {

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

desc("description");

task("example", ["dependency"], function(){ 
  console.log('world.');
});

task("dependency", function(){
  console.log("hello,");
});
