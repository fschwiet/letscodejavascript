var mysql = require('mysql');
var Q = require("q");
var sha1 = require("sha1");

var nconf = require('./config.js');

function getConnectionInfo(includeDatabasename) {

    var connectionInfo = {
        host: nconf.get("database_hostname"),
        user: nconf.get("database_user"),
        password: nconf.get("database_password"),
        multipleStatements: true,
        port: nconf.get("database_port"),
        timezone: 'Z'
    };

    if (includeDatabasename) {
        connectionInfo.database = nconf.get("database_name");
    }

    return connectionInfo;
}

function assertDatabaseIsNotProduction(name) {

    if (nconf.get("isProduction") !== false) {
        throw new Error("Attempted to call " + name + " against a database is production environment.");
    }
}

exports.ensureTestDatabaseIsClean = function(callback) {

    assertDatabaseIsNotProduction("ensureTestDatabaseIsClean");

    var connection = mysql.createConnection(getConnectionInfo());

    connection.connect();

    connection.query(
        "DROP DATABASE IF EXISTS testtemp; CREATE DATABASE testtemp;", function(err, rows, fields) {
            callback(err);
        });

    connection.end();
};

exports.emptyDatabase = function(callback) {

    assertDatabaseIsNotProduction("emptyDatabase");

    var connection = getConnection();

    var query = Q.nbind(connection.query, connection);

    return Q.ninvoke(connection, "query", "SHOW TABLES")
        .then(function(results) {

            var fieldName = results[1][0].name;

            var remainingWork = results[0].map(function(result) {
                var tableName = result[fieldName];

                if (tableName !== "migrations") {
                    return function() {
                        return query("DELETE FROM " + tableName);
                    };
                }
            });

            return remainingWork.reduce(Q.when, Q());
        })
        .then(function() {
            connection.end();
        })
        .then(callback, callback);
};


exports.getStatus = function(callback) {

    useConnection(function(connection, done) {

        connection.query("SELECT version()", function(err, rows, fields) {

            if (err) {
                callback(err.toString() + " (" + connection.config.host + ")");
            } else {
                callback("connected (" + connection.config.host + ")");
            }

            done();
        });
    });
};

function getConnection() {

    var config = getConnectionInfo(true);

    var connection = mysql.createConnection(config);

    connection.connect();

    return connection;
}

exports.getConnection = getConnection;

function useConnection(callback) {

    var connection = getConnection();

    callback(connection, function() {
        connection.end();
    });
}

exports.useConnection = useConnection;


exports.findOrCreateUserByGoogleIdentifier = function(identifier, profile, callback) {

    var connection = getConnection();

    var query = Q.nbind(connection.query, connection);

    query("SELECT users.id, users.friendlyName FROM users JOIN googleProfiles ON googleProfiles.userId = users.id WHERE googleProfiles.id = ?", identifier)
        .then(function(result) {

            if (result[0].length > 0) {
                var firstResult = result[0][0];

                callback(null, {
                        id: firstResult.id,
                        friendlyName: firstResult.friendlyName
                    });
            } else {
                return query("INSERT INTO users SET ?", {
                        friendlyName: profile.displayName
                    })
                    .then(function(result) {

                        var userId = result[0].insertId;

                        return query("INSERT INTO googleProfiles SET ?", {
                                id: identifier,
                                userId: userId,
                                profile: JSON.stringify(profile)
                            })
                            .then(function() {
                                callback(null, {
                                        id: userId,
                                        friendlyName: profile.displayName
                                    });
                            });
                    });
            }
        })
        .fin(function() {
            connection.end();
        })
        .fail(function(err) {
            callback(err);
        });
};

exports.loadSubscriptions = function(userId) {

    var connection = getConnection();

    return Q.ninvoke(connection, "query", "SELECT * FROM subscriptions WHERE userId = ?", userId)
        .then(function(results) {
            return results[0];
        })
        .fin(function() {
            connection.end();
        });
};

exports.saveSubscriptions = function(userId, subscriptions) {

    var connection = getConnection();

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

    var connection = getConnection();

    return Q.npost(connection, "query", ["DELETE FROM subscriptions WHERE rssUrl = ? AND userId = ?", [rssUrl, userId]])
        .fin(function() {
            connection.end();
        });
};

exports.markPostAsRead = function(userId, url) {

    var connection = getConnection();

    var urlHash = sha1(url);

    return Q.ninvoke(connection, "query", 
        " INSERT INTO userPostsRead (userId, url, urlHash) " +
        " SELECT N.* FROM (SELECT ? as userId, ? as url, ? as urlHash) AS N " +
        " LEFT JOIN userPostsRead U ON U.userId = N.userId AND U.urlHash = N.urlHash " +
        " WHERE U.id IS NULL ", 
            [
                userId, 
                url,
                urlHash
            ])
    .then(function() {
        // prevent the result from reaching the caller
    })
    .fin(function() {
        connection.end();
    });
};

exports.markPostAsUnread = function(userId, url) {

    var connection = getConnection();

    return Q.ninvoke(connection, "query", "DELETE FROM userPostsRead WHERE userId = ? AND urlHash = ?", [userId, sha1(url)])
    .then(function() {
        // prevent the result from reaching the caller
    })
    .fin(function() {
        connection.end();
    });
};