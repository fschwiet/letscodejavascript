
(function() {
    "use strict";

    var http = require('http');

    var server = http.createServer();

    exports.start = function() { 

        var index = 0;

        server.on("request", function(request, response) {
            console.log("Received request -- " + (++index) + " -- " + request.url);

            response.end("<html><head><title>This is a test</title></head><body>hello, world</body></html>");
        });

        server.listen(8080);

        console.log("server running");
    };

    exports.stop = function(callback) {
        server.close(callback);
    };
})();

