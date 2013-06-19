var Q = require("q");
var uuid = require('node-uuid');
var expect = require("expect.js");
var assert = require("assert");
var _ = require("underscore");

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

setup.qtest(exports, "saveSubscriptions treats duplicates as updates", function() {

    return findOrCreateUserByGoogleIdentifier(uuid.v4(), setup.getGoogleProfile("Duper"))
        .then(function(user) {

            var userId = user.id;

            return database.saveSubscriptions(userId, [{
                        name: "nameA",
                        rssUrl: "rssA",
                        htmlUrl: "htmlA"
                    }, {
                        name: "nameB",
                        rssUrl: "rssB",
                        htmlUrl: "htmlB"
                    }
                ])
                .then(function() {
                    return database.saveSubscriptions(userId, [{
                                name: "modified nameB",
                                rssUrl: "rssB",
                                htmlUrl: "htmlB"
                            }, {
                                name: "nameC",
                                rssUrl: "rssC",
                                htmlUrl: "htmlC"
                            }
                        ]);
                })
                .then(function() {
                    return database.loadSubscriptions(userId);
                })
                .then(function(results) {

                    // filter out the fields we're testing for
                    results = results.map(function(value) {
                        return {
                            name: value.name,
                            rssUrl: value.rssUrl,
                            htmlUrl: value.htmlUrl
                        };
                    });

                    // put the results in a consistent order
                    results = _.sortBy(results, function(v) {
                        return v.rssUrl;
                    });

                    assert.deepEqual(results, [{
                                name: "nameA",
                                rssUrl: "rssA",
                                htmlUrl: "htmlA"
                            }, {
                                name: "modified nameB",
                                rssUrl: "rssB",
                                htmlUrl: "htmlB"
                            }, {
                                name: "nameC",
                                rssUrl: "rssC",
                                htmlUrl: "htmlC"
                            },

                        ]);
                });
        });
});

setup.qtest(exports, "deleteSubscription should remove subscriptions", function() {

    return findOrCreateUserByGoogleIdentifier(uuid.v4(), setup.getGoogleProfile("Duper"))
        .then(function(user) {

            var userId = user.id;

            return database.saveSubscriptions(userId, [{
                        name: "nameA",
                        rssUrl: "rssA",
                        htmlUrl: "htmlA"
                    }, {
                        name: "nameB",
                        rssUrl: "rssB",
                        htmlUrl: "htmlB"
                    }
                ])
                .then(function() {
                    return database.unsubscribe(userId, "rssB");
                })
                .then(function() {
                    return database.loadSubscriptions(userId);
                })
                .then(function(results) {

                    // filter out the fields we're testing for
                    results = results.map(function(value) {
                        return {
                            name: value.name,
                            rssUrl: value.rssUrl,
                            htmlUrl: value.htmlUrl
                        };
                    });

                    // put the results in a consistent order
                    results = _.sortBy(results, function(v) {
                        return v.rssUrl;
                    });

                    assert.deepEqual(results, [{
                                name: "nameA",
                                rssUrl: "rssA",
                                htmlUrl: "htmlA"
                            }
                        ]);
                });

        });
});

setup.qtest(exports, "deleteSubscription shouldn't remove other people's subscriptions", function() {

    var otherUserId;

    return findOrCreateUserByGoogleIdentifier(uuid.v4(), setup.getGoogleProfile("Other"))
        .then(function(user) {
            otherUserId = user.id;
        })
        .then(function() {
            return findOrCreateUserByGoogleIdentifier(uuid.v4(), setup.getGoogleProfile("User"));
        })
        .then(function(user) {
            return database.saveSubscriptions(user.id, [{
                        name: "nameA",
                        rssUrl: "rssA",
                        htmlUrl: "htmlA"
                    }
                ])
                .then(function() {
                    return database.saveSubscriptions(otherUserId, [{
                                name: "nameA",
                                rssUrl: "rssA",
                                htmlUrl: "htmlA"
                            }
                        ]);
                })
                .then(function() {
                    return database.unsubscribe(user.id, "rssA");
                })
                .then(function() {
                    return database.loadSubscriptions(user.id);
                })
                .then(function(results) {

                    expect(results.length).to.be(0);
                })
                .then(function() {
                    return database.loadSubscriptions(otherUserId);
                })
                .then(function(results) {
                    // filter out the fields we're testing for
                    results = results.map(function(value) {
                        return {
                            name: value.name,
                            rssUrl: value.rssUrl,
                            htmlUrl: value.htmlUrl
                        };
                    });

                    // put the results in a consistent order
                    results = _.sortBy(results, function(v) {
                        return v.rssUrl;
                    });

                    assert.deepEqual(results, [{
                                name: "nameA",
                                rssUrl: "rssA",
                                htmlUrl: "htmlA"
                            }
                        ]);
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