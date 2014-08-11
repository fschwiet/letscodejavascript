var fs = require("fs");
var os = require("os");
var path = require("path");
var setDefault = require('set-default');

var config = require("../config.js");

var waitUntil = require("cauldron").waitUntil;
var testData = require("./test-data.js");
var assertPage = require("cauldron").assertPage;

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

    var tempFile = path.join(os.tmpdir(),"subscriptions.xml");
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