

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

var addTest = require("cauldron").nodeunit.addTest;

var context = setup.givenCleanDatabase(exports);

context.test("Can check last postDate for an rssUrl", function() {

    var rssUrl = "http://feedPosts.example.com/";
    var lastPostDate = new Date("2013/1/3");

    var allPosts = [
        {
            feedName : "a feed", 
            postName : "first post!", 
            postUrl : "http://feedPosts.example.com/first post", 
            postDate : new Date("2013/1/2")
        },                
        {
            feedName : "a feed", 
            postName : "second post, read by user", 
            postUrl : "http://feedPosts.example.com/second post", 
            postDate : new Date("2013/1/2")
        },                
        {
            feedName : "a feed", 
            postName : "third post, read by other user", 
            postUrl : "http://feedPosts.example.com/third post", 
            postDate : lastPostDate
        }
    ];

    return Q()
    .then(function() {
        return dataFeedPosts.writePostsToDatabase(rssUrl, allPosts);
    })
    .then(function() {
        return dataFeedPosts.getLastPostDate(rssUrl);
    })
    .then(function(result) {
        expect(result).to.eql(lastPostDate);
    })
    .then(function() {
        return dataFeedPosts.getLastPostDate("http://some.new.server.example.com/rss");
    })
    .then(function(result) {
        expect(result).to.be(null);
    });
});