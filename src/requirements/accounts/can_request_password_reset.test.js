var assert = require("assert");
var expect = require("expect.js");
var Q = require("q");

var config = require("../../server/config");
var users = require("../../server/data/users.js");

var setup = require("../../test/setup");
var login = require("../../test/login.js");

var waitUntil = require("../../test/waitUntil.js");

var context = setup.usingPhantomPage(setup.whenRunningTheServer(exports));

setup.qtest(context, "User should be able to request a password reset", function() {

    var page = this.page;

    return Q()
    .then(function() {
        return page.open(config.urlFor("/status"));
    })
    .then(function(){ 
        return page.clickElement(login.selectors.loginButton);
    })
    .then(function() {
        return page.waitForSelector(login.selectors.resetPasswordButton);
    })
    .then(function() {
        return page.clickElement(login.selectors.resetPasswordButton);
    })
    .then(function() {
        return page.waitForSelector("span.info");
    })
    .then(function() {
        return page.evaluate(function() {
            return {
                location: window.location.toString(),
                spanInfo: document.querySelector("span.info").innerHTML
            };
        });
    })
    .then(function() {
        expect(location).to.be(config.urlFor("/login"));
        expect(spanInfo).to.contain("password reset email has been sent");
    });
});