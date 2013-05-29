var Q = require("q");

var phantom=require('node-phantom');

function promisify(nodeAsyncFn, context, modifier) {
  return function() {
    var defer = Q.defer()
    , args = Array.prototype.slice.call(arguments);

    args.push(function(err, val) {
      if (err !== null) {
        return defer.reject(err);
      }

      if (modifier)
        modifier(val);

      return defer.resolve(val);
    });

    nodeAsyncFn.apply(context || {}, args);

    return defer.promise;
  };
};

phantom.createSync = promisify(phantom.create, phantom, function(ph) {
  ph.createPageSync = promisify(ph.createPage, ph, function(page) {
    page.openSync = promisify(page.open, page);
  });
});

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
  console.log("calling open");
  return page.openSync("http://google.com/")
  .then(function(status) {
    console.log("opened site? ", status);
    page.evaluate(function() {
      return document.title;
    }, function(err,result) {
      console.log(result);
      cleanup.run();
    });
  })
  .then(function() { console.log("finished");}, function(err) { console.log("failed: " + err)});
  
});



