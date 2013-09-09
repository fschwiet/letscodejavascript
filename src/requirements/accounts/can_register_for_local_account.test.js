var assert = require("assert");
var expect = require("expect.js");
var Q = require("q");
var uuid = require("node-uuid");

var config = require("../../server/config");

var setup = require("../../test/setup");
var login = require("../../test/login.js");
var users = require("../../server/data/users.js");

var waitUntil = require("../../test/waitUntil.js");

var context = setup.usingPhantomPage(setup.whenRunningTheServer(exports));

function testRegistration(startPage) {

    setup.qtest(context, "should be able to register for an account", function() {
        
        var page = this.page;

        var email = "some" + uuid() + "@email.com";
        var username = "SomeUsername" + uuid();
        var password = "SomePassword";

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

setup.qtest(context, "should receive an error message if email is already taken", function() {
    
    var page = this.page;

    var email = "some" + uuid() + "@email.com";
    var username = "SomeUsername" + uuid();
    var password = "SomePassword";

    return Q()
    .then(function() {
        return users.createLocalUser(email, "username" + uuid(), "password" + uuid());
    })
    .then(function() {
        return page.open(config.urlFor("/status"));
    })
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
        return page.waitForSelector("span.info");
    })
    .then(function() {
        return page.evaluate(function() {
            return document.querySelector("span.info").innerHTML;
        });
    })
    .then(function(infoSpanText) {
        expect(infoSpanText).to.be("That email has already been registered on this system.");
    });
});

