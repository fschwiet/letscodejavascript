
/* jshint evil: true */

var Q = require("q");
var phantom = require('node-phantom');
var waitUntil = require("./wait-until.js");


function evaluateCheckingErrors(page) { 
    
    var originalEvaluate = page.evaluate;

    return function() {
        var evaluateArguments =  Array.prototype.slice.apply(arguments);

        return Q()
        .then(function() {
            var errors = [];
            var oldOnError = page.onError;
            page.onError = function(error) {

                errors.push(error.toString());

                if (typeof oldOnError == 'function') {
                    return oldOnError.apply(this, Array.prototype.slice.apply(arguments));
                }
            };

            return Q()
            .then(function() {

                var a = Array.prototype.slice.apply(evaluateArguments);
                var deferred = Q.defer();
                a.splice(1,0,deferred.makeNodeResolver());

                originalEvaluate.apply(page, a);

                return deferred.promise;
            })
            .fin(function() {
                page.onError = oldOnError;

                if (errors.length > 0) {
                    throw new Error(errors.join(', '));
                }
            });                            
        });
    };
}

function PageThatPromises(page) {
    this._page = page;

    this.errors = [];
    this.consoleMessages = [];

    this.evaluate = evaluateCheckingErrors(page);

    var methodsToWrap = ["open", "close", "render", "renderBase64", "injectJs", "includeJs", "sendEvent", "uploadFile", "set", "get", "setFn"];

    var that = this;
    methodsToWrap.forEach(function(method) {
        that[method] = Q.nbind(page[method], page);
    });
}

PageThatPromises.prototype.clickElement = function(selector, allowAmbiguousSelector) {

    var page = this._page;
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

PageThatPromises.prototype.waitForSelector = function(selector) {

    var that = this;

    return waitUntil("page has element matching " + selector, function() {
        return that.evaluate(function(s) {
            return document.querySelector(s) !== null;
        }, selector);
    });
};

module.exports = {
    create : function() {

        var deferredCreate = Q.defer();
        var createArguments = Array.prototype.slice(arguments);
        createArguments.push(deferredCreate.makeNodeResolver());

        phantom.create.apply(phantom, createArguments);

        return deferredCreate.promise.then(function(ph) {

            var originalCreatePage = ph.createPage;

            ph.createPage = function() {
                var deferredCreatePage = Q.defer();
                var createPageArguments = Array.prototype.slice(arguments);
                createPageArguments.push(deferredCreatePage.makeNodeResolver());

                originalCreatePage.apply(ph, createPageArguments);

                return deferredCreatePage.promise
                .then(function(page) {

                    var result = new PageThatPromises(page);

                    page.onError = function(message) {
                        result.errors.push(message);
                    };

                    page.onConsoleMessage = function(message) {
                        result.consoleMessages.push(message);
                    };

                    return result;
                });
            };

            return ph;
        });
    }
};