var assert = require("assert");
var expect = require("expect.js");

var setup = require("../test/setup");
var config = require("../server/config");
var login = require("../test/login.js");

var waitUntil = require("../test/waitUntil.js");

var username = "SomeUsername";
var password = "SomePassword";

var context = setup.usingPhantomPage(setup.whenRunningTheServer(exports));


function doLoginFromPage(page, url) {

    return page.promise.open(url)
    .then(function() {
        console.log("1");
        return page.promise.clickElement(login.selectors.loginButton, true);
    })
    .then(function() {
        return waitUntil("login page loads", function() {
            return page.promise.evaluate(function(selectors) {
                return document.querySelector(selectors.loginUsername) !== null;            
            }, login.selectors);
        });
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
    });
}

setup.qtest(context, "should show user message for invalid username/password", function() {

    var page = this.page;

    return doLoginFromPage(page, config.urlFor("/"))
    .then(function() {
        return waitUntil("login completes", function() {
            return page.promise.evaluate(function() {
                return document.querySelector('span.info') !== null;
            });
        });
    })
    .then(function() {
        return page.promise.evaluate(function() {
            return document.querySelector('span.info').textContent;
        });
    })
    .then(function(textContent) {
        expect(textContent).to.contain('Incorrect username or password');
    });
});

function check_login_from(startPage) {

    setup.qtest(context, "can log in with local account from " + startPage, function() {

        var page = this.page;

        return doLoginFromPage(page, startPage)
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

check_login_from(config.urlFor("/feeds"));
check_login_from(config.urlFor("/status"));
