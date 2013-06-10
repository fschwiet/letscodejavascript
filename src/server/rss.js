var fs = require("fs");
var xml2js = require("xml2js");
var Q = require("q");

var modelFor = require("./modelFor");

module.exports = function(app) {
    app.get("/upload/from/google", handleUploadFromGoogleRequest);
    app.post("/upload/from/google", handleUploadFromGooglePostRequest);
};

function handleUploadFromGoogleRequest(request, response) {

    response.render('uploadFromGoogle', modelFor("Upload your Google RSS reader subscriptions", request));
}

function handleUploadFromGooglePostRequest(request, response, next) {

    var subscriptionsPath = request.files.subscriptionsXml.path;

    loadSubscriptionsFromGoogleXml(subscriptionsPath)
        .then(function(rows) {
            var model = modelFor("Upload complete", request);
            model.rows = rows;

            response.render('uploadedFromGoogle', model);
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
                                    xmlUrl: row.$.xmlUrl,
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