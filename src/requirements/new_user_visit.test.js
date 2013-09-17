var config = require("../server/config.js");
var setup = require("../test/setup.js");
var assertPage = require("../test/assertPage.js");
var assert = require("assert");

var waitUntil = require("cauldron").waitUntil;

var expectedFeedName = "expectedFeedName";
var expectedPostName = "expectedPostName";
var expectedPostUrl = "http://expectedPostUrl.com/readme";

var secondPostName = "secondPostName";
var secondPostUrl = "http://secondPostUrl.com/readme";


var testBlock = setup.usingPhantomPage(setup.whenRunningTheServer(exports));

setup.qtest(testBlock, "New user is guided to import feeds and read them.", function() {

    var page = this.page;

    var callToAction = "Import your feeds.";

    return page.open(config.urlFor("/"))
        .then(function(status) {
            assert.equal(status, "success");
            return assertPage.isAtPath(page, "/login");
        });
});