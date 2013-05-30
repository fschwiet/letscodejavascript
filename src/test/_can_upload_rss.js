(function() {
  "use strict";

  var setup = require("../test/setup");
  var phantom = require("./node-phantom-shim.js");
  var assert = require("assert");

  setup.whenRunningTheServer(exports);

  function it(name, promise) {
    exports["test_" + name] = function(test) {
      promise
        .then(
          function() {
            test.done();
          }, 
          function(err) {
            test.ifError(err || "promise failed for unknown reason"); 
            test.done();
          });
    };
  }

  it("can upload rss", phantom.promise
    .create()
    .then(function(ph) {
      return ph.promise.createPage().then(function(page) {

        return page.promise.open("http://localhost:8081/")
          .then(function(status) {
            assert.equal(status, "success");
          });
      })
      .fin(function() {
        console.log("ph.exit called");
        ph.exit();
      });
    }));
})();

