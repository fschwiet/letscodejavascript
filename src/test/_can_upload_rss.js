(function() {
  "use strict";

  var setup = require("../test/setup");
  var phantom = require("./node-phantom-shim.js");
  var assert = require("assert");

  setup.whenRunningTheServer(exports);

  setup.testPromise(exports, "can upload rss", setup.usingPhantom(
    function(ph) {
      return ph.promise.createPage().then(function(page) {

        return page.promise.open("http://localhost:8081/")
        .then(function(status) {

          assert.equal(status, "success");

          return page.promise.uploadFile('input[name=image]', filepath)
          .then(function() {

          });
        })
        .then(function() {

        });
      });
    }));
})();

