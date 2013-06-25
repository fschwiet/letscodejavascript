
var Q = require("q");

var database = require("../database.js");

exports.loadSubscriptions = function(userId) {

    var connection = database.getConnection();

    return Q.ninvoke(connection, "query", "SELECT * FROM subscriptions WHERE userId = ?", userId)
        .then(function(results) {
            return results[0];
        })
        .fin(function() {
            connection.end();
        });
};

exports.saveSubscriptions = function(userId, subscriptions) {

    var connection = database.getConnection();

    return saveSubscriptionsInternal(connection, userId, subscriptions)
        .fin(function() {
            connection.end();
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

    var connection = database.getConnection();

    return Q.npost(connection, "query", ["DELETE FROM subscriptions WHERE rssUrl = ? AND userId = ?", [rssUrl, userId]])
        .fin(function() {
            connection.end();
        });
};

