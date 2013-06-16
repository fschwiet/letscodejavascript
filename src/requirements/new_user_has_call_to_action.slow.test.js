
var config = require("../server/config.js");
var setup = require("../test/setup.js");
var assertPage = require("./assertPage.js");
var assert = require("assert");

setup.whenRunningTheServer(exports);

exports.withCleanDatabase = {
};

exports.withCleanDatabase.setUp = function(done) {
    console.log("running more setup");
    require("../server/database.js").emptyDatabase(done);
};

setup.qtest(exports.withCleanDatabase, "New user is guided to import feeds and read them.", setup.usingPhantom(function(page) {

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
        return require("./login").doLogin(page);
    })
    .then(function(){
        return assertPage.isAtPath(page, "/feeds");
    })
    .then(function() {
        return require("./uploadRss.js")(page);
    })
    .then(function() {
        return page.promise.clickElement(".info a");
    })
    .then(function() {
        return assertPage.isAtPath(page, "/");
    });
}));
