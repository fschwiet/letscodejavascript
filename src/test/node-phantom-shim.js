
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
          uploadFile : promisify(page.uploadFile, page),
          get : promisify(page.get, page)
        };

        page.promise.clickElement = function(selector) {

          var deferred = Q.defer();

          page.evaluate(function(s) {
            var matches = document.querySelectorAll(s);
            var count = matches.length;

            if (count == 1) {

              // http://stackoverflow.com/questions/6157929/how-to-simulate-mouse-click-using-javascript
              var simulatedClick = function(target, options) {

                var event = target.ownerDocument.createEvent('MouseEvents');
                options = options || {};

                //Set your default options to the right of ||
                var opts = {
                  type: options.type                  || 'click',
                  canBubble:options.canBubble             || true,
                  cancelable:options.cancelable           || true,
                  view:options.view                       || target.ownerDocument.defaultView, 
                  detail:options.detail                   || 1,
                    screenX:options.screenX                 || 0, //The coordinates within the entire page
                    screenY:options.screenY                 || 0,
                    clientX:options.clientX                 || 0, //The coordinates within the viewport
                    clientY:options.clientY                 || 0,
                    ctrlKey:options.ctrlKey                 || false,
                    altKey:options.altKey                   || false,
                    shiftKey:options.shiftKey               || false,
                    metaKey:options.metaKey                 || false, //I *think* 'meta' is 'Cmd/Apple' on Mac, and 'Windows key' on Win. Not sure, though!
                    button:options.button                   || 0, //0 = left, 1 = middle, 2 = right
                    relatedTarget:options.relatedTarget     || null
                  };

                //Pass in the options
                event.initMouseEvent(
                  opts.type,
                  opts.canBubble,
                  opts.cancelable,
                  opts.view, 
                  opts.detail,
                  opts.screenX,
                  opts.screenY,
                  opts.clientX,
                  opts.clientY,
                  opts.ctrlKey,
                  opts.altKey,
                  opts.shiftKey,
                  opts.metaKey,
                  opts.button,
                  opts.relatedTarget
                  );

                //Fire the event
                target.dispatchEvent(event);
              };

              simulatedClick(matches[0]);
            }

            return count;
          }, function(err,count) {

            console.log("evaluate finished with count " + count);
            if (err) {
              deferred.reject(err);
            } else if (count > 1) {
              deferred.reject(new Error("More than one elements matching '" + selector + "' were found"));
            } else if (count < 1) {
              deferred.reject(new Error("An element matching '" + selector + "' not found"));
            } else {
              deferred.resolve();
            }
          }, selector);

          return deferred.promise;
        };
      })
    };
})};



module.exports = phantom;