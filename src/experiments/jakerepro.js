

var Q = require("q");

task("syncfail", function() {
   fail("synchronous failure"); 
});


task("goodasyncfail", function() {

  waitForSleep(function() {
    waitForSleep(function() {
      waitForSleep(function() {
        console.log("all done, time to fail");
        fail("This is the end");
      });
    });
  });

  console.log("finishing sync part");
}, { async:true});


function waitForSleep(callback) {

  setTimeout(function() {
    console.log("finished timeout");
    callback();
  }, 10);
}


task("asyncfail", function() {

    waitForSleepPromise()
    .then(function() { return waitForSleepPromise(); })
    .then(function() { return waitForSleepPromise(); })
    .then(function() { return waitForSleepPromise(); })
    .then(function() {
        console.log("all done, time to fail");
        fail("This is the end");
    });

    console.log("finishing sync part");
}, { async:true});


function waitForSleepPromise() {

  var deferred = Q.defer();

  setTimeout(function() {
    console.log("finished timeout");
    deferred.resolve();
  });

  return deferred.promise;
}