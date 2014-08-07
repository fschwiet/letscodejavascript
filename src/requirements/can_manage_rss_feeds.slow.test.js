var assert = require("assert");
var expect = require("expect.js");

var setup = require("../test/setup");
var config = require("../server/config.js");
var waitUntil = require("cauldron").waitUntil;
var login = require("../test/login.js");

var testBlock = setup.givenCleanDatabase(setup.usingPhantomPage(setup.whenRunningTheServer(exports)));

setup.qtest(testBlock, "can upload rss", function() {

    var page = this.page;

    function getPageStatus() {
        return page.evaluate(function() {
            return {
                fileUploadCount: document.querySelectorAll("form.uploadRss input[type=file]").length,
                loginButtonCount: document.querySelectorAll("a[href='/login']").length
            };
        });
    }

    var unsubscribeRow = "*[data-rssurl='http://blog.stackoverflow.com/']";
    var unsubscribeButton = unsubscribeRow + " a.js-unsubscribe";

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
        .then(getPageStatus)
        .then(function(status) {
            assert.equal(status.fileUploadCount, 0);
            assert.equal(status.loginButtonCount, 2);
        })
        .then(function() {
            return login.doLogin(page);
        })
        .then(getPageStatus)
        .then(function(status) {
            assert.equal(status.fileUploadCount, 1);
            assert.equal(status.loginButtonCount, 0);
        })
        .then(function() {
            return require("../test/uploadRss.js")(page);
        })
        .then(getSubscriptionsFromUI)
        .then(function(results) {
            expect(results["http://blog.stackoverflow.com/"]).to.have.property("title", "stackoverflow");
            expect(results["http://feeds.feedburner.com/tedtalks_video"]).to.have.property("title", "TEDTalks (video)");
        })
        .then(function() {
            return page.open(config.urlFor("/feeds"));
        })
        .then(getSubscriptionsFromUI)
        .then(function(results) {
            expect(results["http://blog.stackoverflow.com/"]).to.have.property("title", "stackoverflow");
            expect(results["http://feeds.feedburner.com/tedtalks_video"]).to.have.property("title", "TEDTalks (video)");
        })
        .then(function() {
            return waitUntil("page has initialized", function() {
                return page.evaluate(function() {
                    return window.mainInitialized === true;
                });
            });
        })
        .then(function() {
            return page.clickElement(unsubscribeButton);
        })
        .then(function() {
            return waitUntil("unsubscribe row is removed", function() {
                return page.evaluate(function(selector) {
                    return document.querySelectorAll(selector).length === 0;
                }, unsubscribeRow);
            });
        })
        .then(function() {
            return page.open(config.urlFor("/feeds"));
        })
        .then(getSubscriptionsFromUI)
        .then(function(results) {

            expect(results["http://blog.stackoverflow.com/"]).to.be(undefined);
        });
});