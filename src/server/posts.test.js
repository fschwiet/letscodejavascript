var assert = require("assert");
var Q = require("q");
var request = require("request");
var uuid = require('node-uuid');

var config = require("../server/config.js");
var dataUserPostsRead = require("../server/data/userPostsRead.js");
var posts = require("../server/posts.js");
var users = require("../server/data/users.js");
var setup = require("../test/setup.js");
var shouldFail = require("cauldron").shouldFail;
var waitUntil = require("cauldron").waitUntil;


var testWithRssOnly = setup.given3rdPartyRssServer(exports);

var expectedPostUrl = "http://www.feedforall.com/restaurant.htm";

var NodeunitBuilder = require("cauldron").nodeunit;

function assertMatchesExpectedPosts(posts) {
    assert.equal(posts[0].feedName, "FeedForAll Sample Feed");
    assert.equal(posts[0].postName, "RSS Solutions for Restaurants");
    assert.equal(posts[0].postUrl, expectedPostUrl);
    assert.equal(JSON.stringify(posts[0].postDate), JSON.stringify(new Date("June 1, 2013")));
}

var browserTest = setup.usingPhantomPage(setup.whenRunningTheServer(setup.givenCleanDatabase(testWithRssOnly)));

function loadRssEndpointsUrl(page, url, skipAuthentication) {

    return page.open(config.urlFor("/"))
        .then(function() {

            return waitUntil("page is loaded", function() {
                return page.evaluate(function() {
                    return typeof $ != 'undefined';
                });
            });
        })
        .then(function() {
            if (!skipAuthentication) {
                return require("../test/login.js").doLogin(page);
            }
        })
        .then(function() {
            return page.evaluate(function(rssFeedsEndpoint) {
                var result = $.ajax(rssFeedsEndpoint, {
                    async: false
                });
                return result.responseJSON;
            }, url);
        });
}


browserTest.test("Should be able to load RSS feeds", function() {

    var url = config.urlFor("/posts", {
            rssUrl: this.rssServer.urlFor("/rss/foo")
        });

    return loadRssEndpointsUrl(this.page, url)
        .then(function(rssFeeds) {
            assertMatchesExpectedPosts(rssFeeds);
        });
});


browserTest.test("Should return empty result for invalid feeds", function() {

    var url = config.urlFor("/posts", {
            rssUrl: this.rssServer.urlFor("/notexistingPath")
        });

    return loadRssEndpointsUrl(this.page, url)
        .then(function(rssFeeds) {
            assert.deepEqual(rssFeeds, []);
        });
});

browserTest.test("Should be able to mark feeds as finished", function() {

    var url = config.urlFor("/posts", {
            rssUrl: this.rssServer.urlFor("/rss/foo")
        });

    var page = this.page;

    return Q()
        .then(function() {
            return loadRssEndpointsUrl(page, url);
        })
        .then(function(rssFeeds) {
            assert.equal(rssFeeds.length, 1);
        })
        .then(function() {

            return page.evaluate(function(finishedUrl, jsonString) {
                $.ajax(finishedUrl, {
                    type: 'POST',
                    data: jsonString,
                    processData: false,
                    contentType: 'application/json',                    
                    async: false
                });
            }, config.urlFor("/posts/finished"), JSON.stringify({ rssUrl: expectedPostUrl}));
        })
        .then(function() {
            return loadRssEndpointsUrl(page, url, true);
        })
        .then(function(rssFeeds) {
            assert.equal(rssFeeds.length, 0);
        })
        .then(function() {

            return page.evaluate(function(unfinishedUrl, jsonString) {
                $.ajax(unfinishedUrl, {
                    type: 'POST',
                    data: jsonString,
                    processData: false,
                    contentType: 'application/json',                    
                    async: false
                });
            }, config.urlFor("/posts/unfinished"), JSON.stringify({ rssUrl: expectedPostUrl}));
        })
        .then(function() {
            return loadRssEndpointsUrl(page, url, true);
        })
        .then(function(rssFeeds) {
            assert.equal(rssFeeds.length, 1);
        });
});

testWithRssOnly.test("loadMeta should be able to load feedName", function() {

    var that = this;
    var rssUrl = this.rssServer.urlFor("/rss/foo");

    return posts.loadMeta(rssUrl)
    .then(function(meta) {
        assert.equal(meta.feedName, that.rssServer.feedName);
    });
});

testWithRssOnly.test("loadFeeds should be able to load RSS feeds", function() {

    return posts.loadFeeds(this.rssServer.urlFor("/rss/foo"))
    .then(assertMatchesExpectedPosts);
});


testWithRssOnly.test("loadFeeds should give error if the http request fails", function() {

    return shouldFail(function() {
        return posts.loadFeeds("http://nonexistsantserver.coommmm/rss/foo");
    }, "getaddrinfo ENOTFOUND");
});


testWithRssOnly.test("loadFeeds should give error if the http request fails #2", function() {

    var that = this;

    return shouldFail(function() {
        return posts.loadFeeds(that.rssServer.urlFor("/notexistingPath"));
    }, "Not a feed");
});


var findOrCreateUserByGoogleIdentifier = Q.nbind(users.findOrCreateUserByGoogleIdentifier);


testWithRssOnly.test("loadFeedsThroughDatabase should be able to load RSS feeds", function() {

    var rssUrl = this.rssServer.urlFor("/rss/" + uuid.v4());

    return findOrCreateUserByGoogleIdentifier(uuid.v4(), setup.getGoogleProfile("user"))
    .then(function(user) {
        return Q()
        .then(function(){
            return posts.loadFeedsThroughDatabase(rssUrl, user.id, new Date());
        }) 
        .then(assertMatchesExpectedPosts);
    });
});


testWithRssOnly.test("loadFeedsThroughDatabase should not insert duplicates", function() {

    var rssUrl = this.rssServer.urlFor("/rss/" + uuid.v4());

    var originTime = new Date();
    var laterTime = new Date(originTime.getTime() + 24 * 60 * 60 * 1000);

    return findOrCreateUserByGoogleIdentifier(uuid.v4(), setup.getGoogleProfile("user"))
    .then(function(user) {
        return Q()
        .then(function(){
            return posts.loadFeedsThroughDatabase(rssUrl, user.id, originTime);
        }) 
        .then(function(){
            return posts.loadFeedsThroughDatabase(rssUrl, user.id, laterTime);
        }) 
        .then(assertMatchesExpectedPosts);
    });
});


testWithRssOnly.test("loadFeedsThroughDatabase should use database values, if fresh", function() {

    var that = this;

    var rssUrl = this.rssServer.urlFor("/rss/" + uuid.v4());

    var originTime = new Date();
    var laterTime = new Date(originTime.getTime() + 5 * 24 * 60 * 60 * 1000);

    return findOrCreateUserByGoogleIdentifier(uuid.v4(), setup.getGoogleProfile("user"))
    .then(function(user) {
        return Q()
        .then(function(){
            return posts.loadFeedsThroughDatabase(rssUrl, user.id, originTime);
        }) 
        .then(function() {
            assert.equal(that.rssServer.requestCount, 1);
        })
        .then(function(){
            return posts.loadFeedsThroughDatabase(rssUrl, user.id, laterTime);
        }) 
        .then(function(){
            return posts.loadFeedsThroughDatabase(rssUrl, user.id, laterTime);
        }) 
        .then(function(){
            return posts.loadFeedsThroughDatabase(rssUrl, user.id, laterTime);
        }) 
        .then(function() {
            assert.equal(that.rssServer.requestCount, 2);
        });
    });
});


testWithRssOnly.test("loadFeedsThroughDatabase should not return feeds that have been marked as read by the user", function() {

    var rssUrl = this.rssServer.urlFor("/rss/" + uuid.v4());
    var postUrl = "http://www.feedforall.com/restaurant.htm";

    var time = new Date();

    return findOrCreateUserByGoogleIdentifier(uuid.v4(), setup.getGoogleProfile("user"))
    .then(function(user) {
        return Q()
        .then(function(){
            return posts.loadFeedsThroughDatabase(rssUrl, user.id, time);
        }) 
        .then(assertMatchesExpectedPosts)
        .then(function() {
            return dataUserPostsRead.markPostAsRead(user.id, postUrl);
        })
        .then(function() {
            return posts.loadFeedsThroughDatabase(rssUrl, user.id, time);
        })
        .then(function(results) {
            assert.deepEqual(results, []);
        })
        .then(function() {
            return dataUserPostsRead.markPostAsUnread(user.id, postUrl);
        })
        .then(function() {
            return posts.loadFeedsThroughDatabase(rssUrl, user.id, time);
        })
        .then(assertMatchesExpectedPosts);
    });
});

