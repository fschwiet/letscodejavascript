
var Q = require("q");
var database = require("../database.js");
var dataRssUrlStatus = require("./rssUrlStatus.js");

exports.loadSubscriptions = function(userId, time) {

    var extraColumns = "";

    var showCouldRefreshColumn = typeof time !== "undefined";

    return database.getPooledConnection()
    .then(function(connection) {

        if (showCouldRefreshColumn) {
            extraColumns = ", (" + dataRssUrlStatus.getSubqueryWhetherRssUrlRequiresUpdateFunky(connection,"S.rssUrlHash", time) + ") as couldRefresh ";
        }
        
        return Q.ninvoke(connection, "query", "SELECT *" + extraColumns + " FROM subscriptions S WHERE S.userId = ?", userId)
        .then(function(results) {

            if (showCouldRefreshColumn) {
                results[0].forEach(function(result) {
                    result.couldRefresh = result.couldRefresh > 0;
                });
            }

            return results[0];
        })
        .fin(function() {
            connection.end();
        });
    });
};

exports.saveSubscriptions = function(userId, subscriptions) {

    return database.getPooledConnection()
    .then(function(connection){
        return saveSubscriptionsInternal(connection, userId, subscriptions)
        .fin(function() {
            connection.end();
        });
    });
};

function saveSubscriptionsInternal(connection, userId, subscriptions) {

    if (subscriptions.length === 0) {
        return;
    }

    var first = subscriptions[0];

    return Q.npost(connection, "query", ["SELECT userId FROM subscriptions S WHERE S.userId = ? AND S.rssUrl = ?", [userId, first.rssUrl]])
        .then(function(results) {

            if (results[0].length === 0) {
                return Q.ninvoke(connection, "query", "INSERT INTO subscriptions SET ?", {
                        userId: userId,
                        name: first.name,
                        rssUrl: first.rssUrl,
                        htmlUrl: first.htmlUrl
                    });
            } else {
                return Q.ninvoke(connection, "query", "UPDATE subscriptions SET ? WHERE userId = ? AND rssUrl = ?", [{
                            name: first.name,
                            htmlUrl: first.htmlUrl
                        },
                        userId, first.rssUrl
                    ]);
            }
        })
        .then(function() {
            return saveSubscriptionsInternal(connection, userId, subscriptions.slice(1));
        });
}

exports.unsubscribe = function(userId, rssUrl) {

    return database.getPooledConnection()
    .then(function(connection){
        return Q.npost(connection, "query", ["DELETE FROM subscriptions WHERE rssUrl = ? AND userId = ?", [rssUrl, userId]])
            .fin(function() {
                connection.end();
            });
    });
};

