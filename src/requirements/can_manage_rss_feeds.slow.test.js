var assert = require("assert");
var expect = require("expect.js");

var setup = require("../test/setup");
var config = require("../server/config.js");
var waitUntil = require("../test/waitUntil");
var login = require("../test/login.js");

var testBlock = setup.whenRunningTheServer(setup.givenCleanDatabase(setup.usingPhantomPage(exports)));

setup.qtest(testBlock, "can upload rss", function() {

    var page = this.page;

    function getPageStatus() {
        return page.promise.evaluate(function() {
            return {
                fileUploadCount: document.querySelectorAll("form.uploadRss input[type=file]").length,
                loginButtonCount: document.querySelectorAll("a[href='/auth/google']").length
            };
        });
    }

    var unsubscribeButton = "tr[data-rssurl='http://blog.stackoverflow.com/'] a.js-unsubscribe[href='#']";

    function getSubscriptionsFromUI() {
        return page.promise.evaluate(function() {
            var result = {};
            var rows = document.querySelectorAll("[data-rssurl]");
            for (var i = 0; i < rows.length; i++) {
                var row = rows[i];
                result[row.getAttribute("data-rssurl")] = {
                    title: row.querySelector('td').innerHTML
                };
            }
            return result;
        });
    }

    return page.promise.open(config.urlFor("/feeds"))
        .then(getPageStatus)
        .then(function(status) {
            console.log("status", status);
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
            return page.promise.open(config.urlFor("/feeds"));
        })
        .then(getSubscriptionsFromUI)
        .then(function(results) {
            expect(results["http://blog.stackoverflow.com/"]).to.have.property("title", "stackoverflow");
            expect(results["http://feeds.feedburner.com/tedtalks_video"]).to.have.property("title", "TEDTalks (video)");
        })
        .then(function() {
            return waitUntil("page has initialized", function() {
                return page.promise.evaluate(function() {
                    return window.mainInitialized === true;
                });
            });
        })
        .then(function() {
            return page.promise.clickElement(unsubscribeButton);
        })
        .then(function() {
            return page.promise.open(config.urlFor("/feeds"));
        })
        .then(getSubscriptionsFromUI)
        .then(function(results) {
            expect(results["http://blog.stackoverflow.com/"]).to.be(undefined);
        });
});