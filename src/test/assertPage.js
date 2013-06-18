var assert = require("assert");
var waitUntil = require("../test/waitUntil.js");

exports.isAtPath = function(page, path) {
    return waitUntil("page is at path " + path, function() {
        return page.promise.evaluate(function() {
            return window.location.pathname;
        })
            .then(function(pathname) {
                return pathname == path;
            });
    });
};

exports.containsContent = function(page, value) {
    return page.promise.get("content")
        .then(function(content) {
            assert.ok(content.indexOf(value) > -1, "Expected page to contain " + value);
        });
};