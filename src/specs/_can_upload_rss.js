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

      return page.promise.uploadFile('input[name=image]', fileToUpload)
      .then(function() {

      });
    })
    .then(function() {

    });

  }));
})();

