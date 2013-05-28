
(function() {
    "use strict";

    var homepageFile = "views/homepage.html";

    var http = require('http');
    var fs = require('fs');
    var path = require('path');

    var database = require("./database.js");

    var express = require('express');
    var app = express();    

    app.set('views', __dirname + '/src/server/views');
    app.set('view engine', 'jade');

    app.get("/", handleHomepageRequest);
    app.get("/status", handleStatusRequest);

    var server;

    exports.start = function(port, callback) { 

        server = http.createServer(app);
        server.listen(port, callback);
    };

    exports.stop = function(callback) {

        if (server) {
            server.close(callback);
            server = null;
        }
    };

    function handleHomepageRequest(request, response) {
        fs.readFile(path.resolve(__dirname, homepageFile), function(err,data) {

            if (err) {
                response.statusCode = 500;
                response.end();
            } else {
                response.end(data);
            }
        });
    }

    function handleStatusRequest(request, response) {
        database.getStatus(function(statusString) {
                            response.render('status', { title: 'Status', databaseStatus: statusString });
                            response.end();
                        });        
    }
})();

