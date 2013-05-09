
(function() {
    "use strict";

    var http = require('http');
    var fs = require('fs');

    var server;

    exports.start = function(port) { 

        server = http.createServer();

        var index = 0;

        server.on("request", function(request, response) {
            if (request.url == "/file.html") {

                fs.readFile("./file.html", function(err,data) {

                    if (err) {
                        response.statusCode = 500;
                        response.end();
                    } else {
                        response.end(data);
                    }
                });

            } else {
                response.end("<html><head><title>This is a test</title></head><body>hello, world</body></html>");                   
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

