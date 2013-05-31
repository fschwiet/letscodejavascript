
var Q = require("q");

var phantom=require('node-phantom');

function promisify(nodeAsyncFn, context, modifier, callbackParameterPosition) {
  return function() {
    var args = Array.prototype.slice.call(arguments);
      var defer = Q.defer();

      callbackWrappingPromise = function(err, val) {
        if (err !== null) {
          return defer.reject(err);
        }

        if (modifier) {
          modifier(val);
        }

        return defer.resolve(val);
      };

      if (typeof callbackParameterPosition !== 'number') {
        args.push(callbackWrappingPromise);
      } else {
        args.splice(callbackParameterPosition,0,callbackWrappingPromise);
      }
      

      for(var key in context) {
        if (context[key] == nodeAsyncFn) {
          console.log("running " + key);
        }
      }

      nodeAsyncFn.apply(context || {}, args);

      return defer.promise;
  };
}

phantom.promise = {
  create : promisify(phantom.create, phantom, function(ph) {
    ph.promise = {
      createPage : promisify(ph.createPage, ph, function(page) {
        page.promise = {
          open : promisify(page.open, page),
          evaluate : promisify(page.evaluate, page, null, 1),
          uploadFile : promisify(page.uploadFile, page)
        };

        page.promise.clickElement = function(selector) {

          var deferred = Q.defer();

          page.evaluate(function(s) {
            return document.querySelectorAll(s).length;
          }, function(err,count) {

            console.log("evaluate finished with count " + count);
            if (err) {
              deferred.reject(err);
            } else if (count > 1) {
              deferred.reject(new Error("More than one elements matching '" + selector + "' were found"));
            } else if (count < 1) {
              deferred.reject(new Error("An element matching '" + selector + "' not found"));
            } else {
              deferred.reject(new Error("click not yet implemented"));
              //deferred.resolve();
            }
          }, selector);

          return deferred.promise;
        };
      })
    };
})};

module.exports = phantom;