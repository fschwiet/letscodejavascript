
var assert = require("assert");
var expect = require("expect.js");
var Q = require("q");

var uuid = require("node-uuid");

var setup = require("../../test/setup.js");

var database = require("../database.js");
var dataRssUrlStatus = require("./rssUrlStatus.js");
var passwordResets = require("./passwordResets.js");
var users = require("./users.js");

setup.qtest(exports, "Should be able to generate and use a reset guid", function() {

    var email = "someEmail" + uuid() + "@server.com";
    var username = "someUser" + uuid();
    var originalPassword = "oldPassword";
    var newPassword = "newPassword";

    return Q()
    .then(function() {
        return users.createLocalUser(email,username,originalPassword);
    })
    .then(function() {
        return users.findUserByLocalAuth(email, originalPassword);
    })
    .then(function(user) {
        expect(user).not.to.be(null);

        return passwordResets.requestResetId(user.id);
    })
    .then(function(passwordResetId) {

        return passwordResets.useResetId(passwordResetId, newPassword);
    })
    .then(function(success) {
        expect(success).to.be(true);

        return users.findUserByLocalAuth(email, originalPassword);
    });
});


// shouldn't recognize reset URLs past a certain time limit
// shouldn't recognize reset URLs when too many are created for one user