var assert = require("assert");
var expect = require("expect.js");
var Q = require("q");

var config = require("../../server/config");
var users = require("../../server/data/users.js");

var setup = require("../../test/setup");
var login = require("../../test/login.js");

var waitUntil = require("cauldron").waitUntil;

var email = "some@email.com";
var username = "SomeUsername";
var password = "SomePassword";

var context = setup.usingPhantomPage(setup.whenRunningTheServer(setup.givenCleanDatabase(exports)));


function doLoginFromPage(page, url) {

    return page.open(url)
    .then(function() {
        return page.clickElement(login.selectors.loginButton, true);
    })
    .then(function() {
        return page.waitForSelector(login.selectors.loginUsername);
    })
    .then(function() {
        return page.evaluate(function(selectors, u,p) {

            document.querySelector(selectors.loginUsername).value = u;
            document.querySelector(selectors.loginPassword).value = p;
        }, login.selectors, email, password);
    })
    .then(function() {
        return page.clickElement(login.selectors.loginLocalSubmit);
    });
}

context.test("should show user message for invalid username/password", function() {

    var page = this.page;

    return doLoginFromPage(page, config.urlFor("/"))
    .then(function() {
        return page.waitForSelector('span.info');
    })
    .then(function() {
        return page.evaluate(function() {
            return document.querySelector('span.info').textContent;
        });
    })
    .then(function(textContent) {
        expect(textContent).to.contain('Incorrect username or password');
    });
});

function check_login_from(startPage) {

    context.test("can log in with local account from " + startPage, function() {

        var page = this.page;

        return Q()
        .then(function() {
            return users.createLocalUser(email, username, password);
        })
        .then(function() {
            return doLoginFromPage(page, startPage);
        })
        .then(function() {
            return page.waitForSelector(login.selectors.logoutButtonSelector);
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

check_login_from(config.urlFor("/feeds"));
check_login_from(config.urlFor("/status"));
