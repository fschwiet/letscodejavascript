var assert = require("assert");
var Q = require("q");
var request = require("request");
var uuid = require('node-uuid');

var config = require("../server/config.js");
var database = require("../server/database.js");
var posts = require("../server/posts.js");
var setup = require("../test/setup.js");

var testWithRssOnly = setup.given3rdPartyRssServer(exports);
var testBlock = setup.whenRunningTheServer(testWithRssOnly);

var expectedPostUrl = "http://www.feedforall.com/restaurant.htm";

function assertMatchesExpectedPosts(posts) {
    assert.equal(JSON.stringify(posts), JSON.stringify([{
                    feedName: "FeedForAll Sample Feed",
                    postName: "RSS Solutions for Restaurants",
                    postUrl: expectedPostUrl,
                    postDate: new Date("June 1, 2013")
                }
            ]));    
}

var expectedUserId = 123; // this.server.extraMiddleware

var inner = {};
testBlock["with user id"] = inner;

inner.setUp = function(done) {

    this.server.extraMiddleware = function(req,res,next) {
        req.user = { 
            id: expectedUserId
        };
        next();
    };

    done();
};

testBlock = inner;


setup.qtest(testBlock, "Should be able to load RSS feeds", function() {

    var url = config.urlFor("/posts", {
            rssUrl: "http://127.0.0.76:8081/rss/foo"
        });

    return Q.nfcall(request, url)
        .then(function(arr) {

            var response = arr[0];
            var body = arr[1];

            assertMatchesExpectedPosts(JSON.parse(body));

            assert.equal(response.headers["content-type"], "application/json");
        });
});

setup.qtest(testBlock, "Should return empty result for invalid feeds", function() {

    var url = config.urlFor("/posts", {
            rssUrl: "http://127.0.0.76:8081/notexistingPath"
        });

    return Q.nfcall(request, url)
        .then(function(arr) {

            var response = arr[0];
            var body = arr[1];

            assert.equal(body, JSON.stringify([]));

            assert.equal(response.headers["content-type"], "application/json");
        });
});

setup.qtest(testBlock, "Should be able to mark feeds as finished", function() {

    var url = config.urlFor("/posts", {
            rssUrl: "http://127.0.0.76:8081/rss/foo"
        });

    return Q.nfcall(request, url)
        .then(function(arr) {
            var body = JSON.parse(arr[1]);
            assert.equal(body.length, 1);
        })
        .then(function() {

            var d = Q.defer();

            request({
                method: 'POST',
                url: config.urlFor("/posts/finished"),
                json: { rssUrl: expectedPostUrl}
            }, function(error, response, body) {

                assert.ifError(error);
                assert.equal(200, response.statusCode);

                d.resolve();
            });

            return d.promise;
        })
        .then(function() {
            return Q.nfcall(request, url);
        })
        .then(function(arr) {
            var body = JSON.parse(arr[1]);
            assert.equal(body.length, 0);
        })
        .then(function() {

            var d = Q.defer();

            request({
                method: 'POST',
                url: config.urlFor("/posts/unfinished"),
                json: { rssUrl: expectedPostUrl}
            }, function(error, response, body) {

                assert.ifError(error);
                assert.equal(200, response.statusCode);

                d.resolve();
            });

            return d.promise;
        })
        .then(function() {
            return Q.nfcall(request, url);
        })
        .then(function(arr) {
            var body = JSON.parse(arr[1]);
            assert.equal(body.length, 1);
        });
});


setup.qtest(testWithRssOnly, "loadFeeds should be able to load RSS feeds", function() {

    return posts.loadFeeds("http://127.0.0.76:8081/rss/foo")
    .then(assertMatchesExpectedPosts);
});

setup.qtest(testWithRssOnly, "loadFeeds should give error if the http request fails", function() {

    return setup.shouldFail(function() {
        return posts.loadFeeds("http://nonexistsantserver.coommmm/rss/foo");
    }, "getaddrinfo ENOTFOUND");
});

setup.qtest(testWithRssOnly, "loadFeeds should give error if the http request fails #2", function() {

    return setup.shouldFail(function() {
        return posts.loadFeeds("http://127.0.0.76:8081/notexistingPath");
    }, "Not a feed");
});


var findOrCreateUserByGoogleIdentifier = Q.nbind(database.findOrCreateUserByGoogleIdentifier);


setup.qtest(testWithRssOnly, "loadFeedsThroughDatabase should be able to load RSS feeds", function() {

    var rssUrl = "http://127.0.0.76:8081/rss/" + uuid.v4();

    return findOrCreateUserByGoogleIdentifier(uuid.v4(), setup.getGoogleProfile("user"))
    .then(function(user) {
        return Q()
        .then(function(){
            return posts.loadFeedsThroughDatabase(rssUrl, user.id);
        }) 
        .then(assertMatchesExpectedPosts);
    });
});


setup.qtest(testWithRssOnly, "loadFeedsThroughDatabase should not insert duplicates", function() {

    var rssUrl = "http://127.0.0.76:8081/rss/" + uuid.v4();

    var originTime = new Date(2012,1,1);
    var laterTime = new Date(2012,1,2);

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


setup.qtest(testWithRssOnly, "loadFeedsThroughDatabase should use database values, if fresh", function() {

    var that = this;

    var rssUrl = "http://127.0.0.76:8081/rss/" + uuid.v4();

    var originTime = new Date(2012,1,1);
    var laterTime = new Date(2012,1,2);

    return findOrCreateUserByGoogleIdentifier(uuid.v4(), setup.getGoogleProfile("user"))
    .then(function(user) {
        return Q()
        .then(function(){
            return posts.loadFeedsThroughDatabase(rssUrl, user.id, originTime);
        }) 
        .then(function(){
            return posts.loadFeedsThroughDatabase(rssUrl, user.id, originTime);
        }) 
        .then(function() {
            assert.equal(that.rssServerRequestCount, 1);
        })
        .then(function(){
            return posts.loadFeedsThroughDatabase(rssUrl, user.id, laterTime);
        }) 
        .then(function() {
            assert.equal(that.rssServerRequestCount, 2);
        });
    });
});


setup.qtest(testWithRssOnly, "loadFeedsThroughDatabase should not return feeds that have been marked as read by the user", function() {

    var rssUrl = "http://127.0.0.76:8081/rss/" + uuid.v4();
    var postUrl = "http://www.feedforall.com/restaurant.htm";

    return findOrCreateUserByGoogleIdentifier(uuid.v4(), setup.getGoogleProfile("user"))
    .then(function(user) {
        return Q()
        .then(function(){
            return posts.loadFeedsThroughDatabase(rssUrl, user.id);
        }) 
        .then(assertMatchesExpectedPosts)
        .then(function() {
            return database.markPostAsRead(user.id, postUrl);
        })
        .then(function() {
            return posts.loadFeedsThroughDatabase(rssUrl, user.id);
        })
        .then(function(results) {
            assert.deepEqual(results, []);
        })
        .then(function() {
            return database.markPostAsUnread(user.id, postUrl);
        })
        .then(function() {
            return posts.loadFeedsThroughDatabase(rssUrl, user.id);
        })
        .then(assertMatchesExpectedPosts);
    });
});
