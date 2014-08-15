
var config = require("../config.js");
var server = require("./server.js");

server.start(config.get("server_internal_port"), function() {

    console.log("Server started.");
});

process.stdin.on('data', function() {
    server.stop(function() {
        process.exit();
    });
});
