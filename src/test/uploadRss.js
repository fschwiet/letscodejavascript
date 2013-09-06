var fs = require("fs");
var path = require("path");
var setDefault = require('set-default');

var config = require("../server/config.js");

var waitUntil = require("./waitUntil.js");
var testData = require("./test-data.js");
var assertPage = require("./assertPage.js");

module.exports = function(page, options) {

    options = setDefault(options).to({
            feeds: [{
                    name: "stackoverflow",
                    rssUrl: "http://blog.stackoverflow.com/",
                    htmlUrl: "http://blog.stackoverflow.com/"
                }, {
                    name: "TEDTalks (video)",
                    rssUrl: "http://feeds.feedburner.com/tedtalks_video",
                    htmlUrl: "http://www.ted.com/talks/list"
                }
            ]
        });

    var tempFile = config.tempPathFor("subscriptions.xml");
    fs.writeFileSync(tempFile, testData.load("subscriptions.xml", {
                feeds: options.feeds
            }));

    return assertPage.isAtPath(page, "/feeds")
        .then(function() {
            return page.uploadFile('form.uploadRss input[type=file]', tempFile);
        })
        .then(function() {
            return page.clickElement('form.uploadRss input[type=submit]');
        })
        .then(function() {

            return waitUntil("upload is complete", function() {
                return page.get("content")
                    .then(function(content) {
                        return content.indexOf("Upload complete") > -1;
                    });
            }, 2000);
        });
};