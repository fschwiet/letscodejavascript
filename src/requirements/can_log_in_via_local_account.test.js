var assert = require("assert");
var expect = require("expect.js");
var Q = require("q");

var config = require("../server/config");
var users = require("../server/data/users.js");

var setup = require("../test/setup");
var login = require("../test/login.js");

var waitUntil = require("../test/waitUntil.js");

var email = "some@email.com";
var username = "SomeUsername";
var password = "SomePassword";

var context = setup.usingPhantomPage(setup.whenRunningTheServer(setup.givenCleanDatabase(exports)));


function doLoginFromPage(page, url) {

    return page.promise.open(url)
    .then(function() {
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
        return page.promise.evaluate(function(selectors, u,p) {

            document.querySelector(selectors.loginUsername).value = u;
            document.querySelector(selectors.loginPassword).value = p;
        }, login.selectors, email, password);
    })
    .then(function() {
        return page.promise.clickElement(login.selectors.loginLocalSubmit);
    });
}

function waitForSelector(page, selector) {
    return waitUntil("page has element matching " + selector, function() {
        return page.promise.evaluate(function(s) {
            return document.querySelector(s) !== null;
        }, selector);
    });
}

setup.qtest(context, "should show user message for invalid username/password", function() {

    var page = this.page;

    return doLoginFromPage(page, config.urlFor("/"))
    .then(function() {
        return waitForSelector(page, 'span.info');
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

        return Q()
        .then(function() {
            return users.createLocalUser(email, username, password);
        })
        .then(function() {
            return doLoginFromPage(page, startPage);
        })
        .then(function() {
            return waitForSelector(page, login.selectors.logoutButtonSelector);
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

check_login_from(config.urlFor("/feeds"));
check_login_from(config.urlFor("/status"));
