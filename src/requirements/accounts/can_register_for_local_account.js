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

        page.promise.open("/status")
        .then(function() {
            return page.promise.clickElement(login.selectors.loginButton, true);
        })
        .then(function() {
            return page.promise.waitForSelector(login.selectors.registerButton);
        })
        .then(function() {
            return page.promise.clickElement(login.selectors.registerButton, true);
        })
        .then(function() {
            return page.promise.waitForSelector(login.selectors.registerUsername);
        })
        .then(function() {
            return page.promise.evaluate(function(selectors, email,username,password) {
                document.querySelector(selectors.registerEmail).val(email);
                document.querySelector(selectors.registerUsername).val(username);
                document.querySelector(selectors.registerPassword).val(password);
            }, login.selectors, email, username, password);
        })
        .then(function() {
            return page.promise.clickElement(selectors.login.registerSubmit);
        })
        .then(function() {

        });
    });
}
/*
testRegistration("/status");
testRegistration("/feeds");
*/