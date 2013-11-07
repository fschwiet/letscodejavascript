var Q = require("q");
var expect = require("expect.js");

var config = require("../server/config.js");
var login = require("../test/login.js");
var setup = require("../test/setup.js");
var waitUntil = require("cauldron").waitUntil;


var context = setup.usingPhantomPage(setup.given3rdPartyRssServer(setup.whenRunningTheServer(setup.givenCleanDatabase(exports))));

function getFirstFeed(page){
    return page.evaluate(function() {

        if (typeof $ == 'undefined')
            return;

        var subscription = $("div[data-rssurl]");
        return {
            count: subscription.length,
            rssUrl: subscription.data("rssurl"),
            title: subscription.find("span.js-title").text().trim()
        };
    });    
}

setup.qtest(context, "Should be able to subscribe to an RSS feed", function() {

    var that = this;
    var page = this.page;

    var subscribedUrl = that.rssServer.urlFor('/rss/url');

    return page.open(config.urlFor("/feeds"))
    .then(function() {
        return login.doLogin(page);
    })
    .then(function() {
        return waitUntil("page is loaded", function() {
            return page.evaluate(function() {
                return typeof $ != 'undefined';
            });
        });
    })
    .then(function() {
        return page.evaluate(function(rssUrl) {
            document.querySelector("form.subscribeForm input[name=subscribeUrl]").value = rssUrl;
        }, subscribedUrl);
    })
    .then(function() {
        return page.clickElement("form.subscribeForm input[type=submit]");
    })
    .then(function() {
        return waitUntil("A subscription feed has been added", function() {
            return getFirstFeed(page)
            .then(function(subscriptionInfo) {
                return subscriptionInfo && subscriptionInfo.count == 1;
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