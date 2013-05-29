var Q = require("q");

var phantom=require('node-phantom');

function promisify(nodeAsyncFn, context, modifier) {
  return function() {
    var args = args = Array.prototype.slice.call(arguments);
    return function() {
      var defer = Q.defer()

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
};

phantom.createSync = promisify(phantom.create, phantom, function(ph) {
  ph.createPageSync = promisify(ph.createPage, ph, function(page) {
    page.openSync = promisify(page.open, page);
    page.evaluateSync = promisify(page.evaluate, page);
  });
});

phantom
.createSync()()
.then(function(ph) {
  return ph.createPageSync()().then(function(page) {
    
    console.log("calling open");
    return page.openSync("http://google.com/")()
      .then(function(status) {

        console.log("opened site? ", status);
      })
      .then(page.evaluateSync(function() {
          return document.title;
      }))
      .then(function(title) {
        console.log("title was " + title);
      })
      .then(function() { 

        console.log("finished");
      });
  })
  .fail(function() {
     console.log("failed: " + err);
  })
  .fin(function() {
    console.log("ph.exit called");
    ph.exit();
  });
});
