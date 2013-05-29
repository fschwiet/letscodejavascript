
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

module.exports = phantom;