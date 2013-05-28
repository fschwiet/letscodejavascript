

var server = require("../server/server.js");

server.start(process.env.PORT, function() {

    console.log("Server started.");
});
