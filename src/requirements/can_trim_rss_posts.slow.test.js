var assert = require("assert");
var expect = require("expect.js");

var config = require("../server/config.js");

var setup = require("../test/setup");
var waitUntil = require("cauldron").waitUntil;

var testBlock = 
    setup.usingPhantomPage(
            setup.given3rdPartyRssServer(
                setup.whenRunningTheServer(
                    setup.givenCleanDatabase(exports))));

setup.qtest(testBlock, "can upload rss", function() {

    var that = this;

    var page = this.page;

    that.rssServer.posts = [];

    for(var i = 0; i < 30; i++) {
        that.rssServer.posts.push({
            postName: "post name " + i,
            postUrl: "http://trimtest.com/" + i,
            postDate: new Date()
        });
    }

    return page.open(config.urlFor("/feeds"))
        .then(function() {
            return require("../test/login.js").doLogin(page);
        })
        .then(function() {
            return require("../test/uploadRss.js")(page, {
                feeds: [{
                    name: "ignored",
                    rssUrl: that.rssServer.urlFor("/rss/whatever"),
                    htmlUrl: "http://ignored.com/"
                }
            ]});
        })
        .then(function() {
            return waitUntil("rss import completes", function() {
                return page.get("content")
                .then(function(content) {
                    return content.indexOf("Upload complete") > -1;
                });
            });
        })
        .then(function() {
            return page.open(config.urlFor("/"));
        })
        .then(function() {
            return waitUntil("the trim posts form appear", function() {
                return page.evaluate(function() {
                    return document.querySelector("form[name='trimPosts']") !== null;
                });
            });
        })
        .then(function() {
            return page.clickElement("input[name='submitTrimPosts']");
        })
        .then(function() {
            return waitUntil("the page loads with the trimmed posts", function() {
                return page.evaluate(function() {
                    return document.querySelectorAll(".js-post").length == 12;
                });
            });
        })
        .fail(function(err) {
            var path = config.tempPathFor("screenshot.png");
            console.log("saving screenshot to " + path);
            page.render(path);
            throw err;
        });
});