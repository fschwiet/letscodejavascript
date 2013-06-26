
var assert = require("assert");
var expect = require("expect.js");
var Q = require("q");
var uuid = require("node-uuid");
var _ = require("underscore");

var setup = require("../../test/setup.js");

var database = require("../database.js");
var dataSubscriptions = require("./subscriptions.js");
var dataRssUrlStatus = require("./rssUrlStatus.js");

var findOrCreateUserByGoogleIdentifier = Q.nbind(database.findOrCreateUserByGoogleIdentifier);


setup.qtest(exports, "loadSubscriptions includes whether the feed status needs updating", function() {

    var originTime = new Date();
    var earlierTime = new Date(originTime.getTime() - 3 * 60 * 60 * 1000);

    return findOrCreateUserByGoogleIdentifier(uuid.v4(), setup.getGoogleProfile("Duper"))
    .then(function(user) {

        var userId = user.id;

        return dataSubscriptions.saveSubscriptions(userId, [
            {
                name: "nameA",
                rssUrl: "rssA",
                htmlUrl: "htmlA"
            }, 
            {
                name: "nameB",
                rssUrl: "rssB",
                htmlUrl: "htmlB"
            }, 
            {
                name: "nameC",
                rssUrl: "rssC",
                htmlUrl: "htmlC"
            }
        ])
        .then(function() {
            return dataRssUrlStatus.writeRssUrlStatus("rssA", "good!", originTime);
        })
        .then(function() {
            return dataRssUrlStatus.writeRssUrlStatus("rssB", "hrmph", earlierTime);
        })
        .then(function() {
            return dataSubscriptions.loadSubscriptions(userId, originTime);
        })
        .then(function(results) {

            var resultsByUrl = {};

            results.forEach(function(result) {
                resultsByUrl[result.rssUrl] = result;
            });

            assert.equal(resultsByUrl.rssA.couldRefresh, false, "expected rssA to not need a refresh");
            assert.equal(resultsByUrl.rssB.couldRefresh, true, "expected rssB to need a refresh");
            assert.equal(resultsByUrl.rssC.couldRefresh, true, "expected rssC to need a refresh");
        });
    });
});

setup.qtest(exports, "saveSubscriptions treats duplicates as updates", function() {

    return findOrCreateUserByGoogleIdentifier(uuid.v4(), setup.getGoogleProfile("Duper"))
        .then(function(user) {

            var userId = user.id;

            return dataSubscriptions.saveSubscriptions(userId, [{
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
                    return dataSubscriptions.saveSubscriptions(userId, [{
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
                    return dataSubscriptions.loadSubscriptions(userId);
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

setup.qtest(exports, "unsubscribe should remove subscriptions", function() {

    return findOrCreateUserByGoogleIdentifier(uuid.v4(), setup.getGoogleProfile("Duper"))
        .then(function(user) {

            var userId = user.id;

            return dataSubscriptions.saveSubscriptions(userId, [{
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
                    return dataSubscriptions.unsubscribe(userId, "rssB");
                })
                .then(function() {
                    return dataSubscriptions.loadSubscriptions(userId);
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

setup.qtest(exports, "unsubscribe shouldn't remove other people's subscriptions", function() {

    var otherUserId;

    return findOrCreateUserByGoogleIdentifier(uuid.v4(), setup.getGoogleProfile("Other"))
        .then(function(user) {
            otherUserId = user.id;
        })
        .then(function() {
            return findOrCreateUserByGoogleIdentifier(uuid.v4(), setup.getGoogleProfile("User"));
        })
        .then(function(user) {
            return dataSubscriptions.saveSubscriptions(user.id, [{
                        name: "nameA",
                        rssUrl: "rssA",
                        htmlUrl: "htmlA"
                    }
                ])
                .then(function() {
                    return dataSubscriptions.saveSubscriptions(otherUserId, [{
                                name: "nameA",
                                rssUrl: "rssA",
                                htmlUrl: "htmlA"
                            }
                        ]);
                })
                .then(function() {
                    return dataSubscriptions.unsubscribe(user.id, "rssA");
                })
                .then(function() {
                    return dataSubscriptions.loadSubscriptions(user.id);
                })
                .then(function(results) {

                    expect(results.length).to.be(0);
                })
                .then(function() {
                    return dataSubscriptions.loadSubscriptions(otherUserId);
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