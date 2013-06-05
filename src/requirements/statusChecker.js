
var assert = require("assert");

function checkStatus(contents, expectedPattern, expectedStatus){
    var match = expectedPattern.exec(contents);

    assert.ok(match !== null, "Did not find " + expectedPattern.toString());

    if (match !== null) {
        assert.equal(match[1].trim(), expectedStatus);
    }
}

exports.assertStatusIsGood = function(contents) {
    checkStatus(contents, (/Database status:(.*)/mi), "connected (localhost)");
    checkStatus(contents, (/Upload path status:(.*)/mi), "writeable");
};