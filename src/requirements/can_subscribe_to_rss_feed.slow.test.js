var assert = require("assert");
var expect = require("expect.js");

var setup = require("../test/setup");
var config = require("../server/config.js");
var waitUntil = require("cauldron").waitUntil;
var login = require("../test/login.js");

var testBlock = setup.givenCleanDatabase(setup.usingPhantomPage(setup.whenRunningTheServer(setup.given3rdPartyRssServer(exports))));

setup.qtest(testBlock, "can upload rss", function() {

    var that = this;

    var siteHtmlUrl = that.rssServer.urlFor("/html/foobar");
    var siteRssUrl = that.rssServer.urlFor("/rss/foobar");
    var siteRssTitle = "this is a site";

    that.rssServer.feedName = siteRssTitle;

    var page = this.page;

    function getSubscriptionsFromUI() {
        return page.evaluate(function() {
            var result = {};
            var rows = document.querySelectorAll("[data-rssurl]");
            for (var i = 0; i < rows.length; i++) {
                var row = rows[i];
                result[row.getAttribute("data-rssurl")] = {
                    title: row.querySelector('.js-title').innerHTML.trim()
                };
            }
            return result;
        });
    }

    return page.open(config.urlFor("/feeds"))
        .then(function() {
            return login.doLogin(page);
        })
        .then(function() {
            return page.evaluate(function(url) {
                document.querySelector("input[name=subscribeUrl]").value = url;
            }, siteHtmlUrl);
        })
        .then(function() {
            return page.clickElement(".subscribeForm input[type=submit]");
        })
        .then(function() {
            return page.waitForSelector("span.info");
        })
        .then(function() {
            return page.evaluate(function() {
                return document.querySelector("span.info").innerText;
            });
        })
        .then(function(spanInfoText) {
            expect(spanInfoText).to.contain("You have subscribed to feed '" + siteRssTitle + "'.");
        })
        .then(getSubscriptionsFromUI)
        .then(function(results) {
            expect(results[siteRssUrl]).to.have.property("title", siteRssTitle);
        });
});