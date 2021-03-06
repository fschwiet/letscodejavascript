(function() {
    "use strict";

    var http = require('http');
    var fs = require('fs-extra');
    var path = require('path');
    var Q = require("q");
    var _ = require("underscore");

    var database = require("./database.js");
    var dataSubscriptions = require("./data/subscriptions.js");
    var dataJoin = require("./data/join.js");

    var express = require('express');
    var connectFlash = require("connect-flash");
    var expressWinston = require("express-winston");
    var winston = require('winston');

    var modelFor = require("./modelFor");

    var auth = require("./auth.js");
    var config = require('../config.js');

    var server;

    exports.start = function(port, callback) {

        var app = express();

        app.use(express.limit('4mb'));
        app.use(express.json());
        app.use(express.urlencoded());
        app.use(express.cookieParser());
        app.use(express.cookieSession({
                    secret: config.get("server_sessionKey")
                }));

        app.set('views', __dirname + '/views');
        app.set('view engine', 'jade');


        app.use(connectFlash());
        auth.addToExpress(port, app);

        require("./posts.js")(app);
        require("./downloadAllPosts.js")(app);
        require("./feeds.js")(app);
        require("./trimPosts.js")(app);

        app.get("/", auth.requireLogin, handleHomepageRequest);
        app.get("/status", handleStatusRequest);
        app.get("/about", handleAboutRequest);

        app.get("/client/main-built.js", function(req, res) {
            var mainBuilt = path.resolve(__dirname + '../../../temp/main-built.js');
            fs.exists(mainBuilt, function(exists) {
                if (exists) {
                    res.sendfile(mainBuilt);
                } else {
                    res.status(404).send("not found");
                }
            });
        });

        app.use("/client/runtime.js", function(req,res){
            res.status(200).sendfile(path.resolve(__dirname, "../../node_modules/jade/runtime.js"));
        });
        app.use("/client", express.static(__dirname + './../client/'));
        app.use("/client/views", express.static(__dirname + './../../temp/views'));

        var transports = [];

        transports.push(new winston.transports.Console({json: true}));

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
        } else {
            callback();
        }
    };

    function handleHomepageRequest(request, response, next) {

        var model = modelFor(config.get("server_friendlyName"), request);

        if (!model.isAuthenticated) { 
            response.redirect('/login');
            return;
        }

        dataSubscriptions.loadSubscriptions(request.user.id, new Date())
        .then(function(subscriptions) {

            model.feeds = subscriptions;

            if (subscriptions.length > 0) {
                return dataJoin.loadPostsForUser(request.user.id)
                .then(function(posts) {

                    posts = _.sortBy(posts, function(v) {
                        if (v.postDate !== null) {
                            return -v.postDate.getTime();
                        }
                        else {
                            return -(new Date(1980,1,1).getTime());
                        }
                    });

                    model.posts = posts;

                    response.render('index', model);
                });

            } else {

                response.redirect("/feeds");
            }
        })
        .fail(function(err) {
            next(err);
        });
    }

    function canWrite(owner, inGroup, mode) {
        return owner && (mode & 0x80) || // User is owner and owner can write.
        inGroup && (mode & 0x10) || // User is in group and group can write.
        (mode & 0x2); // Anyone can write.

    }

    function handleStatusRequest(request, response) {

        var model = {};

        model.nodeVersion = process.version;

        if (typeof request.user === "object") {
            model.userId = request.user.id;
        } else {
            model.userId = "none";
        }

        database.getStatus(function(statusString) {
            model.databaseStatus = statusString;

            // smelly code is smelly
            //  
            var processUid = process.uid;

            if (typeof processUid == 'undefined' && typeof process.getuid == 'function')
                processUid = process.getuid();                

            var processGid = process.gid;

            if (typeof processGid == 'undefined' && typeof process.getgid == 'function')
                processGid = process.getgid();

            response.json(model);
            response.end();
        });
    }

    function errorHandler(err, req, res, next) {
        res.status(400).render("error500", modelFor("Error", req));
    }

    function handleAboutRequest(request, response) {
        response.render('about', modelFor("About " + config.get("server_friendlyName"), request));
    }

})();