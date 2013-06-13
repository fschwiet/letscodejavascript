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

    function test2() {
            return page.promise.evaluate(function() { return { hi:document.querySelectorAll("form.uploadRss input[type=file]").length };});
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
        .then(function() {
            return page.promise.get("content");
        })
        .then(function(content) {
            assertContainsRSSFeeds(content);
        })
        .then(function() {
            return page.promise.open(config.urlFor("/feeds"));
        })
        .then(function() {
            return page.promise.get("content");
        })
        .then(function(content) {
            assertContainsRSSFeeds(content);
        });
}));


function assertContainsRSSFeeds(content) {
    assert.notEqual(content.indexOf("TEDTalks (video)"), -1, "Expected to find subscription title");
    assert.notEqual(content.indexOf("http://feeds.feedburner.com/tedtalks_video"), -1, "Expected to find xml url.");
    assert.notEqual(content.indexOf("http://www.ted.com/talks/list"), -1, "Expected to find html url.");
}