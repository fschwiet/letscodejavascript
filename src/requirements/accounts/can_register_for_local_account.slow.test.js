var assert = require("assert");
var expect = require("expect.js");
var Q = require("q");
var uuid = require("node-uuid");

var config = require("../../config.js");

var setup = require("../../test/setup.js");
var login = require("../../test/login.js");
var users = require("../../server/data/users.js");

var waitUntil = require("cauldron").waitUntil;

var context = setup.usingPhantomPage(setup.whenRunningTheServer(exports));

function tryRegistration(page, startPage, email, username, password, retypedPassword) {

    retypedPassword = retypedPassword || password;

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
        return page.evaluate(function(selectors, email,username,password, retypedPassword) {
            document.querySelector(selectors.registerEmail).value = email;
            document.querySelector(selectors.registerUsername).value = username;
            document.querySelector(selectors.registerPassword).value = password;
            document.querySelector(selectors.registerRetypedPassword).value = retypedPassword;
        }, login.selectors, email, username, password, retypedPassword);
    })
    .then(function() {
        return page.clickElement(login.selectors.registerSubmit);
    });
}

function testRegistration(startPage) {

    context.test("should be able to register for an account", function() {
        
        var page = this.page;

        var email = "some" + uuid() + "@email.com";
        var username = "SomeUsername" + uuid();
        var password = "SomePassword";

        return tryRegistration(page, startPage, email,username,password)
        .then(function() {
            return page.waitForSelector(login.selectors.logoutButtonSelector);
        });
    });
}

testRegistration(config.urlFor("/status"));
testRegistration(config.urlFor("/feeds"));

context.test("should receive an error message if email is already taken", function() {
    
    var page = this.page;

    var email = "some" + uuid() + "@email.com";
    var username = "SomeUsername" + uuid();
    var password = "SomePassword";

    return Q()
    .then(function() {
        return users.createLocalUser(email, "username" + uuid(), "password" + uuid());
    })
    .then(function() {
        return tryRegistration(page, config.urlFor("/status"), email, username, password);
    })
    .then(function() {
        return page.waitForSelector("div.alert-error");
    })
    .then(function() {
        return page.evaluate(function() {
            return document.querySelector("div.alert-error").innerHTML;
        });
    })
    .then(function(infoSpanText) {
        expect(infoSpanText).to.be("That email has already been registered on this system.");
    });
});

context.test("should receive an error message if username is already taken", function() {
    
    var page = this.page;

    var email = "some" + uuid() + "@email.com";
    var username = "SomeUsername" + uuid();
    var password = "SomePassword";

    return Q()
    .then(function() {
        return users.createLocalUser("someotheremail" + uuid() + "@server.com", username, "password" + uuid());
    })
    .then(function() {
        return tryRegistration(page, config.urlFor("/status"), email, username, password);
    })
    .then(function() {
        return page.waitForSelector("div.alert-error");
    })
    .then(function() {
        return page.evaluate(function() {
            return document.querySelector("div.alert-error").innerHTML;
        });
    })
    .then(function(infoSpanText) {
        expect(infoSpanText).to.be("That username has already been registered on this system.");
    });
});


context.test("should receive an error message if password is not retyped correctly", function() {
    
    var page = this.page;

    var email = "some" + uuid() + "@email.com";
    var username = "SomeUsername" + uuid();
    var password = "SomePassword";

    return Q()
    .then(function() {
        return tryRegistration(page, config.urlFor("/status"), email, username, password, "mistyped password");
    })
    .then(function() {
        return page.waitForSelector("div.alert-error");
    })
    .then(function() {
        return page.evaluate(function() {
            return document.querySelector("div.alert-error").innerHTML;
        });
    })
    .then(function(infoSpanText) {
        expect(infoSpanText).to.be("Please type the password twice for verification.");
    });
});



