task("default", function() {
    console.log("default");
});

desc("description");

task("example", ["dependency"], function(){ 
  console.log('world.');
});

task("dependency", function(){
  console.log("hello,");
});
