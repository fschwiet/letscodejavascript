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

phantom.createSync().then(function(ph) {
  return ph.createPageSync().then(function(page) {
    
    console.log("calling open");
    return page.openSync("http://google.com/")
      .then(function(status) {

          console.log("opened site? ", status);
        
          var title = page.evaluate(function() {
            return document.title;
          });
        
          console.log("title was " + title);
        })
      .then(function() { 

          console.log("finished");
          ph.exit();
        }, 
        function(err) { 
        
          console.log("failed: " + err);
        });
  });
});
