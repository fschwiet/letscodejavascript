
var Q = require("q");
var sha1 = require("sha1");
var util = require("util");

var database = require("../database.js");

var timeoutBetweenRssUrlUpdatesInMillseconds = 2 * 60 * 60 * 1000;  //  2 hours


exports.checkIfUrlNeedsUpdate = function(rssUrl, readTime) {

    var urlHash = sha1(rssUrl);
    var boundaryTime = new Date(readTime.getTime() - timeoutBetweenRssUrlUpdatesInMillseconds);

    var connection = database.getConnection();

    var escapedQuery = util.format("SELECT * FROM rssUrlStatus WHERE rssUrlHash = %s AND lastModified > %s",
        connection.escape(urlHash), connection.escape(boundaryTime));

    console.log("escapedQuery", escapedQuery);

    return Q.ninvoke(connection, "query", escapedQuery)
    .then(function(result) {

        if (result[0].length > 0) {
            return false;
        } else {
            return true;
        }
    })
    .fin(function() {
        connection.end();
    });
};

exports.writeRssUrlStatus = function(rssUrl, status, time) {

    var connection = database.getConnection();

    var newRow = {
            rssUrlHash: sha1(rssUrl),
            status: status,
            rssUrl: rssUrl,
            lastModified: time
        };

    var updateRow = {
            status: status,
            rssUrl: rssUrl,
            lastModified: time
        };

    return Q.ninvoke(connection, "query",
        "INSERT INTO rssUrlStatus SET ? ON DUPLICATE KEY UPDATE ?", [newRow, updateRow])
        .fin(function() {
            connection.end();
        });
};


