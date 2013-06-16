(function() {
    "use strict";

    var homepageFile = "views/homepage.html";

    var http = require('http');
    var fs = require('fs-extra');
    var path = require('path');
    var Q = require("q");

    var database = require("./database.js");

    var express = require('express');
    var connectFlash = require("connect-flash");
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

        app.use(connectFlash());

        require("./google-auth")(port, app);

        app.get("/", handleHomepageRequest);
        app.get("/status", handleStatusRequest);

        require("./feeds")(app);

        app.get("/crash", function() {
            throw new Error("Ooops!");
        });

        app.get("/main-built.js", function(req,res) {
            var mainBuilt = path.resolve(__dirname + '../../../temp/main-built.js');
            fs.exists(mainBuilt, function(exists) {
                if (exists) {
                    res.sendfile(mainBuilt);
                } else {
                    res.status(404).send("not found");
                }
            });
        });
        
        app.use("/client", express.static(__dirname + './../client/'));

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

    function handleHomepageRequest(request, response, next) {

        var model = modelFor("homepage", request);

        if (model.isAuthenticated) {

            database.loadSubscriptions(request.user.id)
            .then(function(subscriptions) {
                console.log("subscriptions", subscriptions);
                if (subscriptions.length > 0) {
                    response.render('index', model);
                } else {
                    response.redirect("/feeds");
                }
            }, function(err) {
                next(err);
            });
            
        } else {
            response.render('index', model);
        }
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