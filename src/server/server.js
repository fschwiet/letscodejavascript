
(function() {
    "use strict";

    var homepageFile = "src/server/homepage.html";

    var http = require('http');
    var fs = require('fs');

    var server;

    exports.start = function(port, callback) { 

        server = http.createServer();

        var index = 0;

        server.on("request", function(request, response) {
            if (request.url == "/") {
                fs.readFile(homepageFile, function(err,data) {

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

        server.listen(port, callback);
    };

    exports.stop = function(callback) {
        if (server) {
            server.close(callback);
            server = null;
        }
    };
})();

