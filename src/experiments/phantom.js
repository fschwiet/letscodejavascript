var Q = require("q");

var phantom=require('node-phantom');

function promisify(nodeAsyncFn, context, modifier) {
  return function() {
    var args = args = Array.prototype.slice.call(arguments);
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

phantom.promise = {
  create : promisify(phantom.create, phantom, function(ph) {
    ph.promise = {
      createPage : promisify(ph.createPage, ph, function(page) {
        page.promise = {
          open : promisify(page.open, page),
          evaluate : promisify(page.evaluate, page)
        };
      })
    }
})};

phantom.promise.create()
.then(function(ph) {
  return ph.promise.createPage().then(function(page) {
    
    console.log("calling open");
    return page.promise.open("http://google.com/")
      .then(function(status) {

        console.log("opened site? ", status);
      })
      .then(function() {
        return page.promise.evaluate(function() {
          return document.title;
        });
      })
      .then(function(title) {
        console.log("title was " + title);
      })
      .then(function() { 
        console.log("finished");
      });
  })
  .fail(function(err) {
     console.log("failed: " + err);
  })
  .fin(function() {
    console.log("ph.exit called");
    ph.exit();
  });
});
