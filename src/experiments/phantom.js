var Q = require("q");

var phantom=require('node-phantom');

function _createPageSync() {
  var deferred = Q.defer();

  this.createPage(function(err, page) {
    if (err !== null){
      deferred.reject(err);
    } else {
      deferred.resolve(page);
    }
  });

  return deferred.promise;
}

phantom.createSync = function() {
  var deferred = Q.defer();

  this.create(function(err,ph) {
    if (err !== null)
      deferred.reject(err);  // should be new Error()?
    else
    {
      ph.createPageSync = _createPageSync;

      deferred.resolve(ph);
    }
  });

  return deferred.promise;
}

var cleanup = [];
cleanup.run = function() {
  cleanup.forEach(function(value) { value(); });
}

phantom.createSync().then(function(ph) {
  cleanup.unshift(function() { 
    ph.exit();
  });
  return ph.createPageSync();
}).then(function(page) {
    return page.open("http://google.com/", function(err,status) {
      console.log("opened site? ", status);
//      page.includeJs('http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js', function(err) {
        //jQuery Loaded.
        //Wait for a bit for AJAX content to load on the page. Here, we are waiting 5 seconds.
//        setTimeout(function() {
          return page.evaluate(function() {
            return document.title;
          }, function(err,result) {
            console.log(result);
            cleanup.run();
          });
//        }, 5000);
//      });
  });
});

