var assert = require("assert");
var expect = require("expect.js");
var Q = require("q");

var config = require("../../server/config");

var setup = require("../../test/setup");
var login = require("../../test/login.js");

var waitUntil = require("../../test/waitUntil.js");

var email = "some@email.com";
var username = "SomeUsername";
var password = "SomePassword";

var context = setup.usingPhantomPage(setup.whenRunningTheServer(setup.givenCleanDatabase(exports)));

function testRegistration(startPage) {

    setup.qtest(context, "should be able to register for an account", function() {
        var page = this.page;

        return page.open(startPage)
        .then(function() {
            return page.clickElement(login.selectors.loginButton, true);
        })
        .then(function() {
            return page.waitForSelector(login.selectors.registerButton);
        })
        .then(function() {
            return page.clickElement(login.selectors.registerButton, true);
        })
        .then(function() {
            return page.waitForSelector(login.selectors.registerUsername);
        })
        .then(function() {
            return page.evaluate(function(selectors, email,username,password) {
                document.querySelector(selectors.registerEmail).value = email;
                document.querySelector(selectors.registerUsername).value = username;
                document.querySelector(selectors.registerPassword).value = password;
            }, login.selectors, email, username, password);
        })
        .then(function() {
            return page.clickElement(login.selectors.registerSubmit);
        })
        .then(function() {
            return page.waitForSelector(login.selectors.logoutButtonSelector);
        });
    });
}

testRegistration(config.urlFor("/status"));
testRegistration(config.urlFor("/feeds"));
