var assert = require("assert");
var waitUntil = require("./wait-until.js");

exports.isAtPath = function(page, path) {
    return waitUntil("page is at path " + path, function() {
        return page.evaluate(function() {
            return window.location.pathname;
        })
            .then(function(pathname) {
                return pathname == path;
            });
    });
};

exports.containsContent = function(page, value) {
    return page.get("content")
        .then(function(content) {
            assert.ok(content.indexOf(value) > -1, "Expected page to contain " + value);
        });
};