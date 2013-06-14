var assert = require("assert");
var path = require("path");
var expect = require("expect.js");

var setup = require("../test/setup");
var config = require("../server/config.js");
var waitUntil = require("../test/waitUntil");
var login = require("./login");

var fileToUpload = path.resolve(__dirname, "subscriptions.xml");

setup.whenRunningTheServer(exports);

setup.qtest(exports, "can upload rss", setup.usingPhantom(function(page) {

    function getPageStatus() {
        return page.promise.evaluate(
            function() { 
                return {
                    fileUploadCount : document.querySelectorAll("form.uploadRss input[type=file]").length,
                    loginButtonCount : document.querySelectorAll("a[href='/auth/google']").length
                };
            });   
    }

    function getSubscriptionsFromUI() {
        return page.promise.evaluate(function() {
            var result = {};
            var rows = document.querySelectorAll("[data-rssurl]");
            for(var i = 0; i < rows.length; i++) {
                var row = rows[i];
                result[row.getAttribute("data-rssurl")] =  {
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
            return page.promise.uploadFile('form.uploadRss input[type=file]', fileToUpload);
        })
        .then(function() {
            return page.promise.clickElement('form.uploadRss input[type=submit]');
        })
        .then(function() {

            return waitUntil("upload is complete", function() {
                return page.promise.get("content")
                .then(function(content) {
                    return content.indexOf("Upload complete") > -1;
                });
            }, 2000);
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
        });
}));
