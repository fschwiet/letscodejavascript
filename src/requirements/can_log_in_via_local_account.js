var assert = require("assert");
var setup = require("../test/setup");
var config = require("../server/config");
var login = require("../test/login.js");

var startPage = "/";
/*
setup.qtest(setup.usingPhantomPage(exports), "can log in with local account from " + startPage, function() {

    var page = this.page;

    return page.promise.open(startPage)
        .then(function() {
            return login.doLogin(page);
        })
        .then(function() {
            return page.promise.evaluate(function() {
                return window.location.toString();
            });
        })
        .then(function(location) {
            assert.equal(location, startPage);
        });
});
*/