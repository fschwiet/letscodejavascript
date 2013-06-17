
var config = require("../server/config.js");
var setup = require("../test/setup.js");
var assertPage = require("../test/assertPage.js");
var assert = require("assert");

var testBlock = setup.whenRunningTheServer(setup.givenCleanDatabase(exports));

setup.qtest(testBlock, "New user is guided to import feeds and read them.", setup.usingPhantom(function(page) {

    var callToAction = "Import your feeds.";

    return page.promise.open(config.urlFor("/"))
    .then(function(status){
        assert.equal(status, "success");
        return assertPage.isAtPath(page, "/");
    })
    .then(function() {
        return assertPage.containsContent(page, callToAction);
    })
    .then(function(){
        return require("../test/login.js").doLogin(page);
    })
    .then(function(){
        return assertPage.isAtPath(page, "/feeds");
    })
    .then(function() {
        return require("../test/uploadRss.js")(page);
    })
    .then(function() {
        return page.promise.clickElement(".info a");
    })
    .then(function() {
        return assertPage.isAtPath(page, "/");
    });
}));
