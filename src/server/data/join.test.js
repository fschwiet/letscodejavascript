

var assert = require("assert");
var expect = require("expect.js");
var Q = require("q");
var uuid = require("node-uuid");
var _ = require("underscore");

var users = require("./users.js");
var dataSubscriptions = require("./subscriptions.js");
var dataFeedPosts = require("./feedPosts.js");
var dataUserPostsRead = require("./userPostsRead.js");
var dataJoin = require("./join.js");

var setup = require("../../test/setup.js");

var findOrCreateUserByGoogleIdentifier = Q.nbind(users.findOrCreateUserByGoogleIdentifier);

var context = setup.givenCleanDatabase(exports);

context.test("Can load stored posts for a user", function() {

    var rssUrl = "http://join.someserver.com/" + uuid.v4();

    var allPosts = [
        {
            feedName : "a feed", 
            postName : "first post!", 
            postUrl : "http://firstPost/", 
            postDate : new Date()
        }
    ];


    return findOrCreateUserByGoogleIdentifier(uuid.v4(), setup.getGoogleProfile("someUser"))
    .then(function(user) {

        return dataSubscriptions.saveSubscriptions(user.id, [{
            name: "a feed",
            htmlUrl: rssUrl + "/html",
            rssUrl: rssUrl
        }])
        .then(function() {
            return dataFeedPosts.writePostsToDatabase(rssUrl, allPosts);
        })
        .then(function() {
            return dataJoin.loadPostsForUser(user.id);
        })
        .then(function(results) {

            var expectedTitles = JSON.stringify(_.pluck(allPosts, "postName"));
            var actualTitles = JSON.stringify(_.pluck(results, "postName"));

            assert.equal(actualTitles, expectedTitles);
        });
    });
});


context.test("Only loads posts that have not been read", function() {

    var rssUrl = "http://join.someserver.com/" + uuid.v4();
    var secondPostUrl = "http://secondPost/";
    var thirdPostUrl = "http://thirdPost/";
    var postDate = new Date();

    var allPosts = [
        {
            feedName : "a feed", 
            postName : "first post!", 
            postUrl : "http://firstPost/", 
            postDate : postDate
        },                
        {
            feedName : "a feed", 
            postName : "second post, read by user", 
            postUrl : secondPostUrl, 
            postDate : postDate
        },                
        {
            feedName : "a feed", 
            postName : "third post, read by other user", 
            postUrl : thirdPostUrl, 
            postDate : postDate
        }
    ];

    return findOrCreateUserByGoogleIdentifier(uuid.v4(), setup.getGoogleProfile("Duper"))
    .then(function(user) {

        return dataSubscriptions.saveSubscriptions(user.id, [{
            name: "a feed",
            htmlUrl: rssUrl + "/html",
            rssUrl: rssUrl
        }])
        .then(function() {
            return dataFeedPosts.writePostsToDatabase(rssUrl, allPosts);
        })
        .then(function() {
            return dataUserPostsRead.markPostAsRead(user.id, secondPostUrl);
        })
        .then(function() {
            //  Some other user reading a post shouldn't affect results
            return dataUserPostsRead.markPostAsRead(user.id+1, thirdPostUrl);
        })
        .then(function() {
            //  Posts to some unsubscribed rss feed shouldn't matter
            return dataFeedPosts.writePostsToDatabase("http://someOtherRssFeed.com/rss", [
                    {
                        feedName : "an unsubscribed feed", 
                        postName : "an unsubscribed post", 
                        postUrl : "http://someOtherRssFeed.com/post", 
                        postDate : postDate
                    }
                ]);
        })

        .then(function() {
            return dataJoin.loadPostsForUser(user.id);
        })
        .then(function(results) {

            var expectedPosts = [];
            expectedPosts.push(allPosts[0]);
            expectedPosts.push(allPosts[2]);

            var expectedTitles = JSON.stringify(_.pluck(expectedPosts, "postName"));
            var actualTitles = JSON.stringify(_.pluck(results, "postName"));

            assert.equal(actualTitles, expectedTitles);
        });
    });
});


context.test("Duplicated posts across feeds are only returned once", function() {

    var rssUrl1 = "http://example.org";
    var rssUrl2 = "http://example.org/2";
    var postUrl = "http://firstPost/";
    var postDate = new Date();

    return findOrCreateUserByGoogleIdentifier(uuid.v4(), setup.getGoogleProfile("repostVictim"))
    .then(function(user) {

        return dataSubscriptions.saveSubscriptions(user.id, [{
            name: "a feed",
            htmlUrl: "http://example.org/html",
            rssUrl: rssUrl1
        }])
        .then(function() {

            return dataSubscriptions.saveSubscriptions(user.id, [{
                name: "another feed",
                htmlUrl: "http://example.org/2/html",
                rssUrl: rssUrl2
            }]);            
        })
        .then(function() {
            return dataFeedPosts.writePostsToDatabase(rssUrl1, [{
                feedName : "a feed", 
                postName : "first post!", 
                postUrl : postUrl, 
                postDate : postDate
            }]);
        })
        .then(function() {
            return dataFeedPosts.writePostsToDatabase(rssUrl2, [{
                feedName : "another feed", 
                postName : "second post, read by user", 
                postUrl : postUrl, 
                postDate : postDate
            }]);
        })
        .then(function() {
            return dataJoin.loadPostsForUser(user.id);
        })
        .then(function(results) {

            assert.equal(results.length, 1);
            assert.equal(results[0].postUrl, postUrl);
        });
    });
});
