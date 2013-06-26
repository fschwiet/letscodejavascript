
var Q = require("q");
var sha1 = require("sha1");
var util = require("util");

var database = require("../database.js");

var timeoutBetweenRssUrlUpdatesInMillseconds = 2 * 60 * 60 * 1000;  //  2 hours


function getSubqueryWhetherRssUrlRequiresUpdateFunky(connection, escapedRssUrlHash, time) {

    var boundaryTime = new Date(time.getTime() - timeoutBetweenRssUrlUpdatesInMillseconds);

    return util.format("SELECT COUNT(*) = 0 as needUpdate FROM rssUrlStatus RUS WHERE RUS.rssUrlHash = %s AND RUS.lastModified > %s",
        escapedRssUrlHash, connection.escape(boundaryTime));
}


function getSubqueryWhetherRssUrlRequiresUpdate(connection, rssUrl, time) {

    var urlHash = sha1(rssUrl);

    return getSubqueryWhetherRssUrlRequiresUpdateFunky(connection, connection.escape(urlHash), time);
}

exports.getSubqueryWhetherRssUrlRequiresUpdateFunky = getSubqueryWhetherRssUrlRequiresUpdateFunky;

exports.checkIfUrlNeedsUpdate = function(rssUrl, time) {

    return database.getPooledConnection()
    .then(function(connection){
        var escapedQuery = getSubqueryWhetherRssUrlRequiresUpdate(connection, rssUrl, time);

        return Q.ninvoke(connection, "query", escapedQuery)
        .then(function(result) {

            return result[0][0].needUpdate > 0;
        })
        .fin(function() {
            connection.end();
        });
    });
};

exports.writeRssUrlStatus = function(rssUrl, status, time) {

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

    return database.getPooledConnection()
    .then(function(connection) {
        return Q.ninvoke(connection, "query",
            "INSERT INTO rssUrlStatus SET ? ON DUPLICATE KEY UPDATE ?", [newRow, updateRow])
            .fin(function() {
                connection.end();
            });
    });
};


