(function() {
    "use strict";

    var testUtil = require("./test-util");


    //  run app
    //  verify page loads

    exports.test_canRunServer = function(test) {

        testUtil.downloadFile("http://localhost:8081", function(statusCode, responseBody) {

            test.ok(responseBody.indexOf("homepage marker") !== -1, "Should have marker indicating homepage");
            test.done();
        });
    };
})();