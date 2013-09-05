var assert = require("assert");
var setup = require("../test/setup");
var config = require("../server/config");
var login = require("../test/login.js");

var username = "SomeUsername";
var password = "SomePassword";

var context = setup.usingPhantomPage(setup.whenRunningTheServer(exports));

function check_login_from(startPage) {

    setup.qtest(context, "can log in with local account from " + startPage, function() {

        var page = this.page;

        return page.promise.open(startPage)
            .then(function() {
                console.log("1");
                return page.promise.clickElement(login.selectors.loginButton, true);
            })
            .then(function() {
                console.log("2");
                return page.promise.evaluate(function(selectors, u,p) {

                    document.querySelector(selectors.loginUsername).value = u;
                    document.querySelector(selectors.loginPassword).value = p;
                }, login.selectors, username, password);
            })
            .then(function() {
                console.log("3");
                return page.promise.clickElement(login.selectors.loginLocalSubmit);
            })
            .then(function() {
                console.log("4");
                return page.promise.evaluate(function() {
                    return window.location.toString();
                });
            })
            .then(function(location) {
                console.log("5");
                assert.equal(location, startPage);
            });
    });
}

/*
check_login_from(config.urlFor("/feeds"));
check_login_from(config.urlFor("/status"));
*/