var Q = require("q");

var config = require("../server/config.js");
var login = require("../test/login.js");
var setup = require("../test/setup.js");

var context = setup.usingPhantomPage(setup.whenRunningTheServer(setup.given3rdPartyRssServer(exports)));

setup.qtest(context, "Should be able to subscribe to an RSS feed", function() {

    var that = this;
    var page = this.page;

    return page.promise.open(config.urlFor("/feeds"))
    .then(function() {
        return login.doLogin(page);
    })
    .then(function() {
        return page.promise.evaluate(function(rssUrl) {
            $("form.subscribeForm input[name=rssUrl]").val(rssUrl);
        }, that.rssServer.urlFor('/rss/url'));
    })
    .then(function() {
        return page.promise.clickElement("form.subscribeForm input[type=submit]");
    });
});