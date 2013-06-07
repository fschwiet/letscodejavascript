
(function() {
    "use strict";

    var stateful = require("./stateful.js");
    
    exports.setUp = function(done) {
        stateful.initialize();
        done();
    };

    exports.test_shouldIncrement = function(test) {
        test.equals(100, stateful.getValue());
        stateful.increment(10);
        test.equals(110, stateful.getValue());
        test.done();
    };

    exports.test_valueShouldBeReset = function(test) {
        test.equals(100, stateful.getValue());
        test.done();
    };
})();