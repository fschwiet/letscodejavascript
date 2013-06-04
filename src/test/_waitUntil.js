(function() {
  "use strict";

  var assert = require("assert");
  var setup = require("./setup.js");
  var waitUntil = require("./waitUntil.js");

  setup.qtest(exports, "should wait for evaluation to be true", function() {
    var waits = 0;

    return waitUntil(function() { 
      return ++waits >= 5;
    },500,1).then(function() {
      assert.equal(waits, 5);
    });
  });

  setup.qtest(exports, "should eventually fail if evaluation is false", function() {
    var attempts = 0;

    return setup.shouldFail(function() {
      return waitUntil(function() { 
        attempts++;
        return false;
      });
    }, "timed out");
  });

  // should pass on errors, on first or later attempts
})();

