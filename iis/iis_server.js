

var server = require("../src/server/server.js");

server.start(process.env.PORT, function() {

    console.log("Server started.");
});
