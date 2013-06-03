(function() {
  "use strict";

  var fileToUpload = "subscriptions.xml";

  var setup = require("../test/setup");
  var assert = require("assert");
  var nconf = require("../server/config.js");

  var port = nconf.get("testServer_port");

  setup.whenRunningTheServer(exports);

  setup.qtest(exports, "can upload rss", setup.usingPhantom(function(page) {

    return page.promise.open("http://localhost:" + port + "/")
    .then(function(status) {

      assert.equal(status, "success");

      return page.promise.uploadFile('form.uploadRss input[name=image]', fileToUpload);
    })
    .then(function() {
      return page.promise.clickElement('form.uploadRss input[type=submit]');
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
})();

