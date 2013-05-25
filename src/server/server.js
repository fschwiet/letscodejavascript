
(function() {
    "use strict";

    var homepageFile = "homepage.html";

    var http = require('http');
    var fs = require('fs');
    var path = require('path');

    var database = require("./database.js");

    var server;

    exports.start = function(port, callback) { 

        server = http.createServer();

        server.on('request', function(request, response) {
            if (request.url == "/") {
                    fs.readFile(path.resolve(__dirname, homepageFile), function(err,data) {

                    if (err) {
                        response.statusCode = 500;
                        response.end();
                    } else {
                        response.end(data);
                    }
                });

            } else if (request.url == "/status"){
                database.getStatus(function(statusString) {
                    response.write("Database status: " + statusString);
                    response.end();
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

