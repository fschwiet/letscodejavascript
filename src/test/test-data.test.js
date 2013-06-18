var testData = require("./test-data.js");


exports["can load sample data"] = function(test) {

    var result = testData.load("subscriptions.xml", {
            feeds: []
        });

    test.ok(result.indexOf("opml") > -1);

    test.done();
};