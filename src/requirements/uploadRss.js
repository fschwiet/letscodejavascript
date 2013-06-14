
var path = require("path");
var assertPage = require("./assertPage.js");
var waitUntil = require("../test/waitUntil.js");


module.exports = function(page) {
    var fileToUpload = path.resolve(__dirname, "subscriptions.xml");
    return assertPage.isAtPath(page, "/feeds")
        .then(function() {
            return page.promise.uploadFile('form.uploadRss input[type=file]', fileToUpload);
        })
        .then(function() {
            return page.promise.clickElement('form.uploadRss input[type=submit]');
        })
        .then(function() {

            return waitUntil("upload is complete", function() {
                return page.promise.get("content")
                .then(function(content) {
                    return content.indexOf("Upload complete") > -1;
                });
            }, 2000);
        });        
};