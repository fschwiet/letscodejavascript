
(function() {
    "use strict";

    var homepageFile = "views/homepage.html";

    var http = require('http');
    var fs = require('fs');
    var path = require('path');

    var database = require("./database.js");
    var xml2js = require("xml2js");

    var express = require('express');
    var app = express();    

    var nconf = require('./config.js');

    app.use(express.limit('4mb'));
    app.use(express.bodyParser({ keepExtensions: true, uploadDir: nconf.get("fileUpload_path") }));
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');

    app.get("/", handleHomepageRequest);
    app.get("/status", handleStatusRequest);
    app.get("/upload/from/google", handleUploadFromGoogleRequest);
    app.post("/upload/from/google", handleUploadFromGooglePostRequest);

    app.use(errorHandler);

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

        response.render('index', { title: "homepage" });
    }

    function canWrite(owner, inGroup, mode) {
      return owner && (mode & 0x80) || // User is owner and owner can write.
             inGroup && (mode & 0x10) || // User is in group and group can write.
             (mode & 0x2); // Anyone can write.

    }    

    function handleStatusRequest(request, response) {

        var model = { title: 'Status' };

        database.getStatus(function(statusString) {
            model.databaseStatus = statusString;

            fs.stat(nconf.get("fileUpload_path"), function(err, stat) {

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

    function handleUploadFromGoogleRequest(request, response) {

        response.render('uploadFromGoogle', { title: "Upload your Google RSS reader subscriptions"});
    }

    function handleUploadFromGooglePostRequest(request, response, next) {

        var parser = new xml2js.Parser();

        fs.readFile(request.files.subscriptionsXml.path, function(err, data) {

            if (err) {
                return next(err);
            }

            parser.parseString(data, function(err, result) {

                if (err) {
                    return next(err);
                }

                var rows = [];
                
                try
                {
                    result.opml.body[0].outline.forEach(function(row) {
                        rows.push({
                            name : row.$.title,
                            xmlUrl : row.$.xmlUrl,
                            htmlUrl : row.$.htmlUrl
                        });
                    });
                }
                catch(ex)
                {
                    return next(ex);
                }

                response.render('uploadedFromGoogle', { title: "Upload complete", rows: rows});
            });
        });
    }
})();

function errorHandler(err, req, res, next) {
    res.status(500);
    res.render("error500", {title: "Error", err: err});
}

