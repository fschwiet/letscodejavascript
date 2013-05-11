
(function() {
    "use strict";

    var server = require("./server.js");

    //var stateful = require("./stateful.js");
    exports.test_shouldBeAbleToLoadPage = function(test) {
        var phantom = require('phantom');

        server.start(8080);

        phantom.create(function(ph) {
            ph.createPage(function(page) {
                page.open("http://localhost:8080", function(status) {

                    test.equal("success", status, "Should be able to get page");
                    ph.exit();
                    server.stop();
                    test.done();
                });
            });
        });
    };
})();