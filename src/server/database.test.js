var Q = require("q");
var uuid = require('node-uuid');
var expect = require("expect.js");
var assert = require("assert");
var _ = require("underscore");

var setup = require("../test/setup");
var database = require("./database");

var findOrCreateUserByGoogleIdentifier = Q.nbind(database.findOrCreateUserByGoogleIdentifier);

function getGoogleProfile(postfix) {
    return {
        displayName: 'displayName' + postfix,
        emails: [{
                value: 'emailValue' + postfix
            }
        ],
        name: {
            familyName: 'familyName' + postfix,
            givenName: 'givenName' + postfix
        }
    };
}

setup.qtest(exports, "findOrCreateUserByGoogleIdentifier can save and load users", function() {

    var firstGoogleIdentifier = uuid.v4();
    var firstGoogleProfile = getGoogleProfile("First");

    var secondGoogleIdentifier = uuid.v4();
    var secondGoogleProfile = getGoogleProfile("Second");

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

setup.qtest(exports, "saveSubscriptions treats duplicates as updates", function() {

    return findOrCreateUserByGoogleIdentifier(uuid.v4(), getGoogleProfile("Duper"))
        .then(function(user) {

            var userId = user.id;

            return database.saveSubscriptions(userId, 
                [
                    {name:"nameA", rssUrl:"rssA", htmlUrl:"htmlA"},
                    {name:"nameB", rssUrl:"rssB", htmlUrl:"htmlB"}
                ])
                .then(function() {
                    return database.saveSubscriptions(userId,
                        [
                            {name:"modified nameB", rssUrl:"rssB", htmlUrl:"htmlB"},
                            {name:"nameC", rssUrl:"rssC", htmlUrl:"htmlC"}
                        ]);
                })
                .then(function() {
                    return database.loadSubscriptions(userId);
                })
                .then(function(results){

                    // filter out the fields we're testing for
                    results = results.map(function(value) {
                        return {
                            name : value.name,
                            rssUrl: value.rssUrl,
                            htmlUrl: value.htmlUrl
                        };
                    });

                    // put the results in a consistent order
                    results = _.sortBy(results, function(v) { return v.rssUrl;});

                    assert.deepEqual(results, 
                        [
                            {name:"nameA", rssUrl:"rssA", htmlUrl:"htmlA"},
                            {name:"modified nameB", rssUrl:"rssB", htmlUrl:"htmlB"},
                            {name:"nameC", rssUrl:"rssC", htmlUrl:"htmlC"},
                            
                        ]);
                });
        });
});

