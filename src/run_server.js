
var server = require("./server/server.js");

server.start(8080, function() {

    console.log("Server started.");
});