var assert = require("assert");
var setup = require("../../test/setup");
var config = require("../../server/config");
var login = require("../../test/login.js");

var context = setup.usingPhantomPage(exports);

check_login_from(config.urlFor("/feeds"));
check_login_from(config.urlFor("/status"));

function check_login_from(startPage) {

    context.test("can log in with google credentials from " + startPage, function() {

        var page = this.page;

        return page.open(startPage)
            .then(function() {
                return login.doLogin(page);
            })
            .then(function() {
                return page.evaluate(function() {
                    return window.location.toString();
                });
            })
            .then(function(location) {
                assert.equal(location, startPage);
            });
    });
}