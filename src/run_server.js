
var server = require("./server/server.js");

server.start(process.argv[2], function() {

    console.log("Server started.");
});