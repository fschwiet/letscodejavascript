var path = require("path");

var server = require("../server/server.js");

server.start(process.env.PORT, function() {

    console.log("Server started.");
});

try {
    process.stdin.on('data', function() {
        server.stop(function() {
            process.exit();
        });
    });
}
catch(e) {
    // iisnode doesn't support process.stdin, but in that case we don't want
    // to watch stdin anyhow.   https://github.com/tjanczuk/iisnode/issues/337
}
