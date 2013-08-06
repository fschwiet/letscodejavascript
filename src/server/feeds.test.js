var Q = require("q");
var expect = require("expect.js");

var config = require("../server/config.js");
var login = require("../test/login.js");
var setup = require("../test/setup.js");

var context = setup.usingPhantomPage(setup.whenRunningTheServer(setup.given3rdPartyRssServer(exports)));

setup.qtest(context, "Should be able to subscribe to an RSS feed", function() {

    var that = this;
    var page = this.page;

    var subscribedUrl = that.rssServer.urlFor('/rss/url');

    return page.promise.open(config.urlFor("/feeds"))
    .then(function() {
        return login.doLogin(page);
    })
    .then(function() {
        return page.promise.evaluate(function(rssUrl) {
            $("form.subscribeForm input[name=rssUrl]").val(rssUrl);
        }, subscribedUrl);
    })
    .then(function() {
        return page.promise.clickElement("form.subscribeForm input[type=submit]");
    })
    .then(function() {
        return page.promise.evaluate(function() {
            var subscription = $("data[data-rssurl]");
            return {
                count: subscription.length,
                rssUrl: subscription.data("rssurl"),
                title: subscription.find("span.js-title").text()
            };
        });
    })
    .then(function(subscriptionInfo) {
        expect(subscriptionInfo).to.eql({
            count:1,
            rssUrl:subscribedUrl,
            title:'foo'
        });
    });
});