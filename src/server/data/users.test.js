var Q = require("q");
var uuid = require('node-uuid');
var expect = require("expect.js");
var assert = require("assert");
var uuid = require("node-uuid");

var setup = require("../../test/setup.js");
var users = require("./users.js");

var findOrCreateUserByGoogleIdentifier = Q.nbind(users.findOrCreateUserByGoogleIdentifier);

var addTest = require("cauldron").nodeunit.addTest;

addTest(exports, "findOrCreateUserByGoogleIdentifier can save and load users", function() {

    var firstGoogleIdentifier = uuid.v4();
    var firstGoogleProfile = setup.getGoogleProfile(firstGoogleIdentifier, "First");

    var secondGoogleIdentifier = uuid.v4();
    var secondGoogleProfile = setup.getGoogleProfile(secondGoogleIdentifier, "Second");

    //  Load the first user
    return findOrCreateUserByGoogleIdentifier(uuid.v4(),uuid.v4(), firstGoogleProfile)
        .then(function(firstUser) {
            expect(firstUser.id).to.be.a('number');
            expect(firstUser.friendlyName).to.equal(firstGoogleProfile.displayName);

            //  Load the second user
            return findOrCreateUserByGoogleIdentifier(uuid.v4(),uuid.v4(), secondGoogleProfile)
                .then(function(secondUser) {
                    expect(secondUser.id).to.be.a('number');
                    expect(secondUser.id).not.to.equal(firstUser.id);
                    expect(secondUser.friendlyName).to.equal(secondGoogleProfile.displayName);
                })
                .then(function() {

                    //  Reload the first user
                    return findOrCreateUserByGoogleIdentifier(uuid.v4(),uuid.v4(), firstGoogleProfile)
                        .then(function(reloadedUser) {
                            expect(reloadedUser.id).to.equal(firstUser.id);
                            expect(reloadedUser.friendlyName).to.equal(firstGoogleProfile.displayName);
                        });
                });
        });
});

addTest(exports, "createLocalUser reserves a friendlyName and email transactionally", function() {

    var username = "username" + uuid();
    var email1 = "email1_" + uuid() + "@server.com";
    var email2 = "email2_" + uuid() + "@server.com";
    var password = uuid();

    return users.createLocalUser(email1, "other" + uuid(), uuid())
    .then(function() {
        return users.createLocalUser(email1,username,uuid());
    })
    .then(function() {
        throw new Error("expected second createLocalUser call to fail");
    }, function(err) {
        return users.createLocalUser(email2, username, password);
    })
    .then(function() {
        return users.findUserByLocalAuth(email2, password);
    })
    .then(function(user) {
        expect(user.friendlyName).to.be(username);
    });
});

addTest(exports, "findUserByLocalAuth should reject invalid username/password", function() {

    return users.findUserByLocalAuth("someUsername", "somePassword")
    .then(function(result) {
        expect(result).to.be(null);
    });
});

addTest(exports, "findUserByLocalAuth should load use for valid email/password", function() {

    var email = "Someemail" + uuid() +"@value.com";
    var username = "someUsername" + uuid();
    var password = "somePassword" + uuid();

    return Q()
    .then(function() {
        return users.createLocalUser(email,username,password);
    })
    .then(function() {
        return users.findUserByLocalAuth(email, password);
    })
    .then(function(firstUser) {
        expect(firstUser.id).to.be.a('number');
        expect(firstUser.friendlyName).to.equal(username);
        expect(firstUser.email).to.equal(email);
    });
});

addTest(exports, "findUserByLocalAuth should load use for valid username/password", function() {

    var email = "Someemail" + uuid() + "@value.com";
    var username = "someUsername" + uuid();
    var password = "somePassword" + uuid();

    return Q()
    .then(function() {
        return users.createLocalUser(email,username,password);
    })
    .then(function() {
        return users.findUserByLocalAuth(username, password);
    })
    .then(function(firstUser) {
        expect(firstUser.id).to.be.a('number');
        expect(firstUser.friendlyName).to.equal(username);
        expect(firstUser.email).to.equal(email);
    });
});

addTest(exports, "updateUserPassword should change a user's password", function() {

    var email = "Someemail" + uuid() + "@value.com";
    var username = "someUsername" + uuid();
    var oldPassword = "oldPassword" + uuid();
    var newPassword = "newPassword" + uuid();

    return Q()
    .then(function() {
        return users.createLocalUser(email,username,oldPassword);
    })
    .then(function() {
        return users.findUserByLocalAuth(username, oldPassword);
    })
    .then(function(user) {
        return users.updateUserPassword(user.id, newPassword);
    })
    .then(function(result) {
        expect(result).to.be(true);
        return users.findUserByLocalAuth(username, newPassword);
    })
    .then(function(user) {
        expect(user).not.to.be(null);
    });
});

addTest(exports, "updateUserPassword should report if the user's local password could not be found", function() {
    return Q()
    .then(function() {
        return users.updateUserPassword(1234345, "Fsdf");
    })
    .then(function(result) {
        expect(result).to.be(false);
    });
});

