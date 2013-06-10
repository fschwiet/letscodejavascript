(function() {
    "use strict";

    var homepageFile = "views/homepage.html";

    var http = require('http');
    var fs = require('fs-extra');
    var path = require('path');
    var Q = require("q");

    var database = require("./database.js");

    var express = require('express');
    var expressWinston = require("express-winston");
    var winston = require('winston');

    var modelFor = require("./modelFor");

    var nconf = require('./config.js');

    var server;

    exports.start = function(port, callback) {

        var app = express();

        app.use(express.limit('4mb'));
        app.use(express.bodyParser({
                    keepExtensions: true,
                    uploadDir: nconf.tempPathForUploads()
                }));
        app.use(express.cookieParser());
        app.set('views', __dirname + '/views');
        app.set('view engine', 'jade');

        app.use(express.cookieSession({
                    secret: nconf.get("server_sessionKey")
                }));

        require("./google-auth")(port, app);

        app.get("/", handleHomepageRequest);
        app.get("/status", handleStatusRequest);

        require("./rss")(app);

        app.get("/crash", function() {
            throw new Error("Ooops!");
        });

        var errorLoggingFile = path.resolve(nconf.tempPathForLogs(), "errors.json");

        var transports = [];
        transports.push(new winston.transports.File({
                    filename: errorLoggingFile,
                    maxsize: 64 * 1024 * 1024,
                    maxFiles: 20,
                    json: true
                }));

        if (!nconf.isProduction) {
            transports.push(new winston.transports.Console({
                        json: true
                    }));
        }

        app.use(expressWinston.errorLogger({
                    transports: transports
                }));

        app.use(errorHandler);

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

        response.render('index', modelFor("homepage", request));
    }

    function canWrite(owner, inGroup, mode) {
        return owner && (mode & 0x80) || // User is owner and owner can write.
        inGroup && (mode & 0x10) || // User is in group and group can write.
        (mode & 0x2); // Anyone can write.

    }

    function handleStatusRequest(request, response) {

        var model = modelFor('Status', request);

        database.getStatus(function(statusString) {
            model.databaseStatus = statusString;

            fs.stat(nconf.tempPathForUploads(), function(err, stat) {

                if (err) {
                    model.uploadPathStatus = err.toString();
                } else if (canWrite(process.uid === stat.uid, process.gid === stat.gid, stat.mode)) {
                    model.uploadPathStatus = "writeable";
                } else {
                    model.uploadPathStatus = "insufficient permissions";
                }

                response.render('status', model);
                response.end();
            });
        });
    }

    function errorHandler(err, req, res, next) {
        res.render("error500", modelFor("Error", req));
    }

})();