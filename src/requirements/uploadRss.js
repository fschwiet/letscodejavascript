
var path = require("path");

module.exports = function(page) {
    var fileToUpload = path.resolve(__dirname, "subscriptions.xml");
    return page.promise.evaluate(function() {
            return window.location.pathname;
        })
        .then(function(pathname) {
            assert.equal(pathname, "/feeds");
        })
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