var assert = require("assert");
var expect = require("expect.js");

var setup = require("../test/setup");
var config = require("../server/config.js");
var waitUntil = require("../test/waitUntil");

var testBlock = setup.usingPhantomPage(setup.whenRunningTheServer(exports));

setup.qtest(testBlock, "can load about page", function() {

    var page = this.page;

    return page.promise.open(config.urlFor("/about"))
    .then(function() {
        return waitUntil("the about page loads", function() {
            return page.promise.get("content")
            .then(function(content){
                return content.indexOf("About") > -1;
            });
        });
    });
});
