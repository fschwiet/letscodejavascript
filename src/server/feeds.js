var fs = require("fs");
var xml2js = require("xml2js");
var Q = require("q");

var modelFor = require("./modelFor");
var database = require("./database");

module.exports = function(app) {
    app.get("/feeds", handleUploadFromGoogleRequest);
    app.post("/feeds", handleUploadFromGooglePostRequest);
};

function handleUploadFromGoogleRequest(request, response) {

    var model = modelFor("Manage your RSS feed subscriptions", request);

    if (typeof request.user == "object") {
        database.useConnection(function(connection, connectionDone) {

            Q.ninvoke(connection, "query", "SELECT * FROM subscriptions WHERE userId = ?", request.user.id)
            .then(function(results) {
                model.rows = results[0];
            })
            .then(function() {
                connectionDone();

                response.render('feeds', model);
            });
        });
    }
    else {

        response.render('feeds_unauthenticated', model);
    }
}

function handleUploadFromGooglePostRequest(request, response, next) {

    var subscriptionsPath = request.files.subscriptionsXml.path;

    loadSubscriptionsFromGoogleXml(subscriptionsPath)
    .then(function(rows) {

        database.useConnection(function(connection, connectionDone) {

            database.saveSubscriptions(connection, request.user.id, rows)
            .fin(function() {
                connectionDone();
            })
            .then(function() {
                request.flash("info", "Upload complete");
                response.redirect("/feeds");
            }, function(err) {
                next(err);
            });
        });
    });
}

function loadSubscriptionsFromGoogleXml(filepath) {

    var deferred = Q.defer();
    var parser = new xml2js.Parser();

    fs.readFile(filepath, function(err, data) {

        if (err) {
            deferred.reject(err);
        } else {
            parser.parseString(data, function(err, result) {

                if (err) {
                    deferred.reject(err);
                } else {
                    var rows = [];

                    try {
                        result.opml.body[0].outline.forEach(function(row) {
                            rows.push({
                                    name: row.$.title,
                                    rssUrl: row.$.xmlUrl,
                                    htmlUrl: row.$.htmlUrl
                                });
                        });
                    } catch (ex) {
                        deferred.reject(ex);
                        return;
                    }

                    deferred.resolve(rows);
                }
            });
        }
    });

    return deferred.promise;
}

