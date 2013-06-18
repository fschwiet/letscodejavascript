var config = require("../server/config.js");
var setup = require("../test/setup.js");
var assertPage = require("../test/assertPage.js");
var assert = require("assert");

var waitUntil = require("../test/waitUntil");

var expectedFeedName = "expectedFeedName";
var expectedPostName = "expectedPostName";
var expectedPostUrl = "http://expectedPostUrl.com/readme";

var testBlock = setup.given3rdPartyRssServer(setup.whenRunningTheServer(setup.givenCleanDatabase(exports)), {
        feedName: expectedFeedName,
        postName: expectedPostName,
        postUrl: expectedPostUrl
    });

setup.qtest(testBlock, "New user is guided to import feeds and read them.", setup.usingPhantom(function(page) {

            var callToAction = "Import your feeds.";

            return page.promise.open(config.urlFor("/"))
                .then(function(status) {
                    assert.equal(status, "success");
                    return assertPage.isAtPath(page, "/");
                })
                .then(function() {
                    return assertPage.containsContent(page, callToAction);
                })
                .then(function() {
                    return require("../test/login.js").doLogin(page);
                })
                .then(function() {
                    return assertPage.isAtPath(page, "/feeds");
                })
                .then(function() {
                    return require("../test/uploadRss.js")(page, {
                            feeds: [{
                                    name: "ignored",
                                    rssUrl: "http://127.0.0.76:" + config.get("server_port") + "/rss",
                                    htmlUrl: "http://ignored/"
                                }
                            ]
                        });
                })
                .then(function() {
                    return page.promise.clickElement(".info a");
                })
                .then(function() {
                    return assertPage.isAtPath(page, "/");
                })
                .then(function() {
                  return waitUntil("feed loads", function() {
                      return page.promise.get("content")
                          .then(function(content) {
                              return content.indexOf(expectedFeedName) > -1;
                          });
                  });                
                })
                .then(function() {
                    return page.promise.get("content");
                })
                .then(function(content) {
                    assert.ok(content.indexOf(expectedFeedName) > -1);
                    assert.ok(content.indexOf(expectedPostName) > -1);
                    assert.ok(content.indexOf(expectedPostUrl) > -1);
                });
        }));