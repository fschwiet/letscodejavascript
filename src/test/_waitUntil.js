(function() {
  "use strict";

  var assert = require("assert");
  var setup = require("./setup.js");
  var waitUntil = require("./waitUntil.js");

  exports.test_should_wait_for_evaluation_to_be_true = function(test) {

    var waits = 0;

    var p = waitUntil(function() { 
      return ++waits >= 5;
    });

    p.then(function() {
      assert.equal(waits, 5);
      test.done();
    }).
    fail(function(err) {

      test.doesNotThrow(function() { throw err; });
      test.done();
    });
  };
})();

