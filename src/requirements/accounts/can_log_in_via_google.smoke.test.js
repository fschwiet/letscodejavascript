var assert = require("assert");
var setup = require("../../test/setup");
var config = require("../../server/config");
var login = require("../../test/login.js");

check_login_from(config.urlFor("/feeds"));
check_login_from(config.urlFor("/status"));

function check_login_from(startPage) {

    setup.qtest(setup.usingPhantomPage(exports), "can log in with google credentials from " + startPage, function() {

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
}