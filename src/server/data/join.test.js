

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

var NodeunitBuilder = require("cauldron").nodeunit;
var scope = new NodeunitBuilder(exports, "meh");

scope.test("Can load stored posts for a user", function() {

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