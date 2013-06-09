
var setup = require("../test/setup");
var assert = require("assert");
var config = require("../server/config.js");
var Q = require("q");
var waitUntil = require("../test/waitUntil");
var path = require("path");

var fileToUpload = path.resolve(__dirname, "subscriptions.xml");

setup.whenRunningTheServer(exports);

setup.qtest(exports, "can upload rss", setup.usingPhantom(function(page) {

  return page.promise.open(config.urlFor("/upload/from/google"))
  .then(function(status) {

    assert.equal(status, "success");

    return page.promise.uploadFile('form.uploadRss input[type=file]', fileToUpload);
  })
  .then(function() {
    return page.promise.clickElement('form.uploadRss input[type=submit]');
  })
  .then(function() {

    return waitUntil("upload is complete",function() {
      return page.promise.evaluate(function() { return document.title; })
        .then(function(title) {
          console.log("title", title);
          return title.indexOf("Upload complete") > -1;
        });
    }, 2000);
  })
  .then(function() {
    return page.promise.get("content");
  })
  .then(function(content) {
    assert.notEqual(content.indexOf("TEDTalks (video)"), -1, "Expected to find subscription title");
    assert.notEqual(content.indexOf("http://feeds.feedburner.com/tedtalks_video"), -1, "Expected to find xml url.");
    assert.notEqual(content.indexOf("http://www.ted.com/talks/list"), -1, "Expected to find html url.");
  });
}));

