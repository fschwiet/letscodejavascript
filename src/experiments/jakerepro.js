

var Q = require("q");

task("syncfail", function() {
   fail("synchronous failure"); 
});

var http = require("http");

task("asyncfail", function() {

    waitForSleep()().then(waitForSleep).then(waitForSleep).then(waitForSleep).then(function() {
        console.log("all done, time to fail");
        fail("This is the end");
    });

    console.log("finishing sync part");
}, { async:true});


function waitForSleep() {

  return function() {
    var deferred = Q.defer();

    setTimeout(function() {
      console.log("finished timeout");
      deferred.resolve();
    });

    return deferred.promise;
  };
}