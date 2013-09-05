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
