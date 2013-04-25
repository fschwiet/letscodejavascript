task("default", function() {
    console.log("default");
});

task("lint", function() {

  var runner = require("./build/lint/lint_runner.js");
  runner.validateFile("./jakefile.js");

});

desc("description");

task("example", ["dependency"], function(){ 
  console.log('world.');
});

task("dependency", function(){
  console.log("hello,");
});
