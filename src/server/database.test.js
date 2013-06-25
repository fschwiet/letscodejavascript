var Q = require("q");
var uuid = require('node-uuid');
var expect = require("expect.js");
var assert = require("assert");

var setup = require("../test/setup");
var database = require("./database");

var findOrCreateUserByGoogleIdentifier = Q.nbind(database.findOrCreateUserByGoogleIdentifier);

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

setup.qtest(exports, "markPostAsRead shouldn't insert duplicates", function() {

    return findOrCreateUserByGoogleIdentifier(uuid.v4(), setup.getGoogleProfile("Other"))
        .then(function(user) {
            return database.markPostAsRead(user.id, "http://someurl.com/")
            .then(function() {
                return database.markPostAsRead(user.id, "http://someurl.com/");
            })
            .then(function() {

                var connection = database.getConnection();

                return Q.ninvoke(connection, "query", "SELECT COUNT(*) AS count FROM userPostsRead WHERE userId = ?", [user.id])
                .then(function(results) {

                    assert.deepEqual(results[0], [{count:1}]);
                })
                .fin(function() {

                    connection.end();
                });                
            });
        });
});