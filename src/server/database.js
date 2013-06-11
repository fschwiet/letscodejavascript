var mysql = require('mysql');
var Q = require("q");

var nconf = require('./config.js');

function getConnectionInfo(includeDatabasename) {

    var connectionInfo = {
        host: nconf.get("database_hostname"),
        user: nconf.get("database_user"),
        password: nconf.get("database_password"),
        multipleStatements: true,
        port: nconf.get("database_port")
    };

    if (includeDatabasename) {
        connectionInfo.database = nconf.get("database_name");
    }

    return connectionInfo;
}

exports.ensureTestDatabaseIsClean = function(callback) {

    if (nconf.get("isProduction") !== false) {
        throw new Error("Attempted to clean test database is production environment.");
    }

    var connection = mysql.createConnection(getConnectionInfo());

    connection.connect();

    connection.query(
        "DROP DATABASE IF EXISTS testtemp; CREATE DATABASE testtemp;", function(err, rows, fields) {
            callback(err);
        });

    connection.end();
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

function useConnection(callback) {

    var config = getConnectionInfo(true);

    var connection = mysql.createConnection(config);

    connection.connect();

    callback(connection, function() {
        connection.end();
    });
}

exports.useConnection = useConnection;


exports.findOrCreateUserByGoogleIdentifier = function(identifier, profile, done) {

    exports.useConnection(function(connection, connectionDone) {

        var query = Q.nbind(connection.query, connection);

        query("SELECT users.id, users.friendlyName FROM users JOIN googleProfiles ON googleProfiles.userId = users.id WHERE googleProfiles.id = ?", identifier)
            .then(function(result) {

                if (result[0].length > 0) {
                    var firstResult = result[0][0];

                    done(null, {
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
                                    done(null, {
                                            id: userId,
                                            friendlyName: profile.displayName
                                        });
                                });
                        });
                }
            })
            .fin(function() {
                connectionDone();
            })
            .fail(function(err) {
                done(err);
            });
    });
};

exports.loadSubscriptions = function(connection, userId) {
    return Q.ninvoke(connection, "query", "SELECT * FROM subscriptions WHERE userId = ?", userId)
    .then(function(results) {
        return results[0];
    });
};

exports.saveSubscriptions = function(connection, userId, subscriptions) {

    if (subscriptions.length === 0) {
        return;
    }

    var first = subscriptions[0];

    return Q.npost(connection, "query", ["SELECT userId FROM subscriptions S WHERE S.userId = ? AND S.rssUrl = ?", [userId, first.rssUrl]])
    .then(function(results) {

        return Q.ninvoke(connection, "query", "INSERT INTO subscriptions SET ?", {
            userId: userId,
            name: first.name,
            rssUrl: first.rssUrl,
            htmlUrl: first.htmlUrl
        });
    })
    .then(function() {
        return exports.saveSubscriptions(connection, userId, subscriptions.slice(1));
    });
};
