var assert = require("assert");
var expect = require("expect.js");
var Q = require("q");
var util = require("util");
var uuid = require("node-uuid");

var config = require("../../config.js");
var users = require("../../server/data/users.js");

var setup = require("../../test/setup.js");
var login = require("../../test/login.js");

var waitUntil = require("cauldron").waitUntil;

var context = setup.usingPhantomPage(setup.whenRunningTheServer(setup.givenSmtpServer(exports)));

Q.longStackSupport = true;

context.test("User should be able to request a password reset by username", function() {

    var username = "someUsername" + uuid();
    var emailAddress = "someEmail" + uuid() + "@server.com";
    var newPassword = "someNewPassword";

    var page = this.page;
    var smtpServer = this.smtpServer;

    var emailsReceived = [];

    smtpServer.bind(emailAddress, function(address,id,email) {
        emailsReceived.push(email);
    });

    return Q()
    .then(function() {
        return users.createLocalUser(emailAddress, username, uuid());
    })
    .then(function() {
        return page.open(config.urlFor("/about"));
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
        return page.waitForSelector(login.selectors.resetUsernameOrEmail);
    })
    .then(function() {
        return page.evaluate(function(s,v) {
            document.querySelector(s).value = v;
        }, login.selectors.resetUsernameOrEmail, username);
    })
    .then(function() {
        return page.clickElement(login.selectors.resetSubmit);
    })
    .then(function() {
        return page.waitForSelector("span.info");
    })
    .then(function() {
        return page.evaluate(function() {
            return {
                spanInfo: document.querySelector("span.info").innerHTML
            };
        });
    })
    .then(function(result) {
        expect(result.spanInfo).to.contain("password reset email has been sent");
    })
    .then(function(){

        expect(emailsReceived.length).to.be(1);
        var email = emailsReceived[0];

        expect(email.sender).to.be(config.get("support_email"));
        expect(email.data).to.contain(util.format('From: "%s" <%s>', config.get("server_friendlyName"), config.get("support_email")));

        var expectedReceivers = {};
        expectedReceivers[emailAddress] = true;
        expect(email.receivers).to.eql(expectedReceivers);

        var urlRegex = /http:\/\/[.a-z0-9]+(:[0-9]+)?\/resetPassword\/[\-a-z0-9]+/;
        var match = urlRegex.exec(email.body);

        expect(match).not.to.be(null);

        return page.open(match[0]);
    })
    .then(function() {
        return page.waitForSelector(login.selectors.resetNewPassword);
    })
    .then(function() {
        return page.evaluate(function(selectors, password) {
            document.querySelector(selectors.resetNewPassword).value = password;
            document.querySelector(selectors.resetNewPasswordConfirmation).value = password;
        }, login.selectors, newPassword);
    })
    .then(function() {
        return page.clickElement(login.selectors.resetNewSubmit);
    })
    .then(function() {
        return page.waitForSelector("span.info");
    })
    .then(function() {
        return page.evaluate(function() {
            return document.querySelector("span.info").innerText;
        });
    })
    .then(function(spanInfoText) {
        expect(spanInfoText).to.contain("Your password has be reset");
    });
});


context.test("invalid reset urls should be handled gracefully", function() {

    var page = this.page;

    var newPassword = uuid();

    return page.open(config.urlFor("/resetPassword/" + uuid()))
    .then(function() {
        return page.evaluate(function(selectors, password) {
            document.querySelector(selectors.resetNewPassword).value = password;
            document.querySelector(selectors.resetNewPasswordConfirmation).value = password;
        }, login.selectors, newPassword);
    })
    .then(function() {
        return page.clickElement(login.selectors.resetNewSubmit);
    })
    .then(function() {
        return page.waitForSelector("span.info");
    })
    .then(function() {
        return page.evaluate(function() {
            return {
                message : document.querySelector("span.info").innerText,
                locationPath : window.location.pathname             
            };
        });
    })
    .then(function(results){
        expect(results.message).to.contain("The password reset link you have turns out to be invalid");
        expect(results.locationPath).to.be("/resetPassword");
    });
});


context.test("The user is required to type in their new password twice", function() {

    var page = this.page;

    var startingPath = "/resetPassword/" + uuid();
    var newPassword = uuid();

    return page.open(config.urlFor(startingPath))
    .then(function() {
        return page.evaluate(function(selectors, password1, password2) {
            document.querySelector(selectors.resetNewPassword).value = password1;
            document.querySelector(selectors.resetNewPasswordConfirmation).value = password2;
        }, login.selectors, uuid(), uuid());
    })
    .then(function() {
        return page.clickElement(login.selectors.resetNewSubmit);
    })
    .then(function() {
        return page.waitForSelector(".alert-error");
    })
    .then(function() {
        return page.evaluate(function() {
            return {
                message : document.querySelector(".alert-error").innerText,
                locationPath : window.location.pathname             
            };
        });
    })
    .then(function(results){
        expect(results.message).to.contain("To ensure we have the right password, it must be typed twice.");
        expect(results.locationPath).to.be(startingPath);
    });
});
