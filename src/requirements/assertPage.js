

var assert = require("assert");

exports.isAtPath = function(page, path)
{
    page.promise.evaluate(function() {
        return window.location.pathname;
    })
    .then(function(pathname) {
        assert.equal(pathname, path, "Expected to be at path " + path + ", but was actually at " + pathname);
    });
};

exports.containsContent = function(page, value)
{
    return page.promise.get("content")
    .then(function(content) {
        assert.ok(content.indexOf(value) > -1, "Expected page to contain " + value);
    });
};

