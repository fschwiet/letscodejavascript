var assert = require("assert");
var expect = require("expect.js");
var Q = require("q");
var util = require("util");
var uuid = require("node-uuid");

var config = require("../../server/config");
var users = require("../../server/data/users.js");

var setup = require("../../test/setup");
var login = require("../../test/login.js");

var waitUntil = require("../../test/waitUntil.js");

var context = setup.usingPhantomPage(setup.whenRunningTheServer(setup.givenSmtpServer(exports)));

setup.qtest(context, "User should be able to request a password reset by username", function() {

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

        var urlRegex = /http:\/\/[.a-z0-9]+(:[0-9]+)?\/resetPassword\/[-a-z0-9]+/;
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


