
var Q = require("q");
var uuid = require('node-uuid');
var expect = require("expect.js");

var googleAuth = require("../server/google-auth");
var setup = require("../test/setup");

var hydrateUser = Q.nbind(googleAuth.hydrateUser);

function getGoogleProfile(postfix) {
    return { 
        displayName: 'displayName' + postfix,
        emails: [ { value: 'emailValue' + postfix } ],
        name: { familyName: 'familyName' + postfix, givenName: 'givenName' + postfix }
    };
}

setup.qtest(exports, "hydrateUser can save and load users", function() {

    var firstGoogleIdentifier = uuid.v4();
    var firstGoogleProfile = getGoogleProfile("First");

    var secondGoogleIdentifier = uuid.v4();
    var secondGoogleProfile = getGoogleProfile("Second");

    //  Load the first user
    return hydrateUser(firstGoogleIdentifier, firstGoogleProfile)
    .then(function(firstUser) {
        expect(firstUser.id).to.be.a('number');
        expect(firstUser.friendlyName).to.equal("displayNameFirst");

        //  Load the second user
        return hydrateUser(secondGoogleIdentifier, secondGoogleProfile)
       .then(function(secondUser) {
            expect(secondUser.id).to.be.a('number');
            expect(secondUser.id).not.to.equal(firstUser.id);
            expect(secondUser.friendlyName).to.equal("displayNameSecond");
        })
        .then(function() {

            //  Reload the first user
            return hydrateUser(firstGoogleIdentifier, firstGoogleProfile)
            .then(function(reloadedUser) {
                expect(reloadedUser.id).to.equal(firstUser.id);
                expect(reloadedUser.friendlyName).to.equal("displayNameFirst");
            });
        });
    });
});
    