var Q = require("q");
var phantom = require('node-phantom');

var waitUntil = require("./waitUntil.js");

function promisify(nodeAsyncFn, context, modifier, isPageEvaluate) {
    return function() {
        var args = Array.prototype.slice.call(arguments);
        var defer = Q.defer();

        var errors = [];
        var oldOnError = context.onError;
        context.onError = function(error) {

            errors.push(error.toString());
            return oldOnError.apply(this, Array.prototype.slice.apply(arguments));
        };

        callbackWrappingPromise = function(err, val) {

            context.onError = oldOnError;

            if (errors.length > 0) {
                return defer.reject(errors.join(', '));
            }

            if (err !== null) {
                return defer.reject(err);
            }

            if (modifier) {
                modifier(val);
            }

            return defer.resolve(val);
        };

        if (!isPageEvaluate) {
            args.push(callbackWrappingPromise);
        } else {
            args.splice(1, 0, callbackWrappingPromise);
        }

        /*
      for(var key in context) {
        if (context[key] == nodeAsyncFn) {
          console.log("running " + key);
        }
      }
      */

        try {
            nodeAsyncFn.apply(context || {}, args);
        } catch (err) {
            context.onError = oldOnError;
            defer.reject(err || name + " failed within promsifiy.");
            return;
        }

        return defer.promise;
    };
}

phantom.promise = {
    create: promisify(phantom.create, phantom, function(ph) {
        ph.promise = {
            createPage: promisify(ph.createPage, ph, function(page) {
                page.promise = {
                    open: promisify(page.open, page),
                    evaluate: promisify(page.evaluate, page, null, true),
                    uploadFile: promisify(page.uploadFile, page),
                    get: promisify(page.get, page),
                    render: promisify(page.render, page)
                };

                page.promise.clickElement = function(selector, allowAmbiguousSelector) {

                    var deferred = Q.defer();

                    page.evaluate(function(s, allowAmbiguousSelector) {
                        var matches = null;

                        if (s.indexOf('function') === 0) {
                            //matches = document.querySelectorAll("a.target");
                            matches = eval("(" + s + ")()");
                        } else {
                            matches = document.querySelectorAll(s);
                        }
                        
                        var count = matches.length;

                        if (count == 1 || (allowAmbiguousSelector && count > 1)) {

                            // http://stackoverflow.com/questions/6157929/how-to-simulate-mouse-click-using-javascript
                            var simulatedClick = function(target, options) {

                                var event = target.ownerDocument.createEvent('MouseEvents');
                                options = options || {};

                                //Set your default options to the right of ||
                                var opts = {
                                    type: options.type || 'click',
                                    canBubble: options.canBubble || true,
                                    cancelable: options.cancelable || true,
                                    view: options.view || target.ownerDocument.defaultView,
                                    detail: options.detail || 1,
                                    screenX: options.screenX || 0, //The coordinates within the entire page
                                    screenY: options.screenY || 0,
                                    clientX: options.clientX || 0, //The coordinates within the viewport
                                    clientY: options.clientY || 0,
                                    ctrlKey: options.ctrlKey || false,
                                    altKey: options.altKey || false,
                                    shiftKey: options.shiftKey || false,
                                    metaKey: options.metaKey || false, //I *think* 'meta' is 'Cmd/Apple' on Mac, and 'Windows key' on Win. Not sure, though!
                                    button: options.button || 0, //0 = left, 1 = middle, 2 = right
                                    relatedTarget: options.relatedTarget || null
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
                                    opts.relatedTarget);

                                //Fire the event
                                target.dispatchEvent(event);
                            };

                            simulatedClick(matches[0]);
                        }

                        return count;
                    }, function(err, count) {

                        if (err) {
                            deferred.reject(err);
                        } else if (count > 1 && !allowAmbiguousSelector) {
                            deferred.reject(new Error("More than one elements matching '" + selector + "' were found"));
                        } else if (count < 1) {
                            deferred.reject(new Error("An element matching '" + selector + "' not found"));
                        } else {
                            deferred.resolve();
                        }
                    }, typeof selector == 'function' ? selector.toString() : selector, allowAmbiguousSelector);

                    return deferred.promise;
                };

                page.promise.waitForSelector = function(selector) {
                    return waitUntil("page has element matching " + selector, function() {
                        return page.promise.evaluate(function(s) {
                            return document.querySelector(s) !== null;
                        }, selector);
                    });
                };
            })
        };
    })
};



module.exports = phantom;