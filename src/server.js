
(function() {
    "use strict";

    var http = require('http');

    var server;

    exports.start = function(port) { 

        server = http.createServer();

        var index = 0;

        server.on("request", function(request, response) {
            //console.log("Received request -- " + (++index) + " -- " + request.url);

            response.end("<html><head><title>This is a test</title></head><body>hello, world</body></html>");
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

