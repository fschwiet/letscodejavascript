var Q = require("q");
var uuid = require('node-uuid');
var expect = require("expect.js");
var assert = require("assert");

var setup = require("../../test/setup.js");
var users = require("./users.js");

var findOrCreateUserByGoogleIdentifier = Q.nbind(users.findOrCreateUserByGoogleIdentifier);

setup.qtest(exports, "findOrCreateUserByGoogleIdentifier can save and load users", function() {

    var firstGoogleIdentifier = uuid.v4();
    var firstGoogleProfile = setup.getGoogleProfile("First");

    var secondGoogleIdentifier = uuid.v4();
    var secondGoogleProfile = setup.getGoogleProfile("Second");

    //  Load the first user
    return findOrCreateUserByGoogleIdentifier(firstGoogleIdentifier, firstGoogleProfile)
        .then(function(firstUser) {
            expect(firstUser.id).to.be.a('number');
            expect(firstUser.friendlyName).to.equal("displayNameFirst");

            //  Load the second user
            return findOrCreateUserByGoogleIdentifier(secondGoogleIdentifier, secondGoogleProfile)
                .then(function(secondUser) {
                    expect(secondUser.id).to.be.a('number');
                    expect(secondUser.id).not.to.equal(firstUser.id);
                    expect(secondUser.friendlyName).to.equal("displayNameSecond");
                })
                .then(function() {

                    //  Reload the first user
                    return findOrCreateUserByGoogleIdentifier(firstGoogleIdentifier, firstGoogleProfile)
                        .then(function(reloadedUser) {
                            expect(reloadedUser.id).to.equal(firstUser.id);
                            expect(reloadedUser.friendlyName).to.equal("displayNameFirst");
                        });
                });
        });
});

setup.qtest(exports, "findUserByLocalAuth should reject invalid username/password", function() {

    return users.findUserByLocalAuth("someUsername", "somePassword")
    .then(function(result) {
        expect(result).to.be(null);
    });
});

setup.qtest(exports, "findUserByLocalAuth should load use for valid username/password", function() {

    var email = "Someemail@value.com";
    var username = "someUsername";
    var password = "somePassword";

    return Q()
    .then(function() {
        return users.createLocalUser(email,username,password);
    })
    .then(function() {
        return users.findUserByLocalAuth(email, password);
    })
    .then(function(firstUser) {
        console.log("firstUser", firstUser);
        expect(firstUser.id).to.be.a('number');
        expect(firstUser.friendlyName).to.equal(username);
    });
});