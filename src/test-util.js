(function() {
    var http = require("http");
    
    exports.downloadFile = function(url, callback) {
        var result = http.get(url, function(response) {
            response.setEncoding("utf8");
            
            var responseBody = "";

            response.on("data",function(chunk) {
                responseBody += chunk;
            });

            response.on("end", function() {
                callback(response.statusCode, responseBody);
            });
        });
    };
})();