
var path = require("path");

var server = require("../server/server.js");

var workingDirectory = path.resolve(__dirname, "../..");
process.chdir(workingDirectory)

server.start(process.env.PORT, function() {

    console.log("Server started.");
});
