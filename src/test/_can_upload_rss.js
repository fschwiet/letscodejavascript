(function() {
  "use strict";

  var setup = require("../test/setup");
  var assert = require("assert");

  setup.whenRunningTheServer(exports);

/*
  setup.qtest(exports, "can upload rss", setup.usingPhantom(function(page) {

    return page.promise.open("http://localhost:8081/")
    .then(function(status) {

      assert.equal(status, "success");

      return page.promise.uploadFile('input[name=image]', filepath)
      .then(function() {

      });
    })
    .then(function() {

    });

    }));
*/
})();

