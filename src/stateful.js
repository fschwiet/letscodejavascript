
(function() {
    "use strict";

    var value = 0;

    exports.initialize = function() {
        value = 100;
    };

    exports.increment = function(inc) {
        value = inc + value;
    };

    exports.getValue = function() {
        return value;
    };
})();