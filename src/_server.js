
var server = require("./server.js");

exports.test1 = function(test) {
    test.ok(server.exists(), "first server.js test");
    test.done();
};