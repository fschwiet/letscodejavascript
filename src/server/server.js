
(function() {
    "use strict";

    var singlepageFile = "src/server/file.html";

    var http = require('http');
    var fs = require('fs');

    var server;

    exports.start = function(port) { 

        server = http.createServer();

        var index = 0;

        server.on("request", function(request, response) {
            if (request.url == "/") {
                response.end("hello, world");
            } else if (request.url == "/file.html") {

                fs.readFile(singlepageFile, function(err,data) {

                    if (err) {
                        response.statusCode = 500;
                        response.end();
                    } else {
                        response.end(data);
                    }
                });

            } else {                
                response.statusCode = 404;
                response.end();
            }
        });

        server.listen(port);
    };

    exports.stop = function(callback) {
        if (server) {
            server.close(callback);
            server = null;
        }
    };
})();

