
var Q = require("q");
var sha1 = require("sha1");
var util = require("util");

var database = require("../database.js");

var timeoutBetweenRssUrlUpdatesInMillseconds = 2 * 60 * 60 * 1000;  //  2 hours

function getSubqueryWhetherRssUrlRequiresUpdate(connection, rssUrl, time) {

    var urlHash = sha1(rssUrl);

    var boundaryTime = new Date(time.getTime() - timeoutBetweenRssUrlUpdatesInMillseconds);

    return util.format("SELECT COUNT(*) = 0 as needUpdate FROM rssUrlStatus WHERE rssUrlHash = %s AND lastModified > %s",
        connection.escape(urlHash), connection.escape(boundaryTime));
}

exports.checkIfUrlNeedsUpdate = function(rssUrl, time) {

    var connection = database.getConnection();

    var escapedQuery = getSubqueryWhetherRssUrlRequiresUpdate(connection, rssUrl, time);

    return Q.ninvoke(connection, "query", escapedQuery)
    .then(function(result) {

        return result[0][0].needUpdate > 0;
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


