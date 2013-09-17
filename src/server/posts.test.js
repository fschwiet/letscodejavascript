var assert = require("assert");
var Q = require("q");
var request = require("request");
var uuid = require('node-uuid');

var config = require("../server/config.js");
var dataUserPostsRead = require("../server/data/userPostsRead.js");
var posts = require("../server/posts.js");
var users = require("../server/data/users.js");
var setup = require("../test/setup.js");
var shouldFail = require("../test/should-fail.js");

var testWithRssOnly = setup.given3rdPartyRssServer(exports);

var expectedPostUrl = "http://www.feedforall.com/restaurant.htm";

var NodeunitBuilder = require("../test/nodeunit-builder.js");

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

var testBlock = new NodeunitBuilder(setup.whenRunningTheServer(testWithRssOnly), "with user id");

testBlock.setUp = function(done) {

    this.server.extraMiddleware = function(req,res,next) {
        req.user = { 
            id: expectedUserId
        };
        next();
    };

    done();
};


testBlock.test("Should be able to load RSS feeds", function() {

    var url = config.urlFor("/posts", {
            rssUrl: this.rssServer.urlFor("/rss/foo")
        });

    return Q.nfcall(request, url)
        .then(function(arr) {

            var response = arr[0];
            var body = arr[1];

            assertMatchesExpectedPosts(JSON.parse(body));

            assert.equal(response.headers["content-type"], "application/json");
        });
});


testBlock.test("Should return empty result for invalid feeds", function() {

    var url = config.urlFor("/posts", {
            rssUrl: this.rssServer.urlFor("/notexistingPath")
        });

    return Q.nfcall(request, url)
        .then(function(arr) {

            var response = arr[0];
            var body = arr[1];

            assert.equal(body, JSON.stringify([]));

            assert.equal(response.headers["content-type"], "application/json");
        });
});

testBlock.test("Should be able to mark feeds as finished", function() {

    var url = config.urlFor("/posts", {
            rssUrl: this.rssServer.urlFor("/rss/foo")
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

