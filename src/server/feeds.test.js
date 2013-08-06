var Q = require("q");
var expect = require("expect.js");

var config = require("../server/config.js");
var login = require("../test/login.js");
var setup = require("../test/setup.js");
var waitUntil = require("../test/waitUntil");


var context = setup.usingPhantomPage(setup.whenRunningTheServer(setup.given3rdPartyRssServer(exports)));

function getFirstFeed(page){
    return page.promise.evaluate(function() {
        var subscription = $("div[data-rssurl]");
        return {
            count: subscription.length,
            rssUrl: subscription.data("rssurl"),
            title: subscription.find("span.js-title").text()
        };
    });    
}

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
        return waitUntil("A subscription feed has been added", function() {
            return getFirstFeed(page)
            .then(function(subscriptionInfo) {
                return typeof subscriptionInfo == 'object' && subscriptionInfo.count == 1;
            });
        });
    })
    .then(function() {
        return getFirstFeed(page);
    })
    .then(function(subscriptionInfo) {
        expect(subscriptionInfo).to.eql({
            count:1,
            rssUrl:subscribedUrl,
            title: that.rssServer.feedName
        });
    });
});