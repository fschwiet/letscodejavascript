var path = require("path");

var server = require("../server/server.js");

server.start(process.env.PORT, function() {

    console.log("Server started.");
});

process.stdin.on('data', function() {
    server.stop(function() {
        process.exit();
    });
});
