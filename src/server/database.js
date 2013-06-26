var mysql = require('mysql');
var Q = require("q");

var nconf = require('./config.js');

var poolConfig = getConnectionInfo(true);
poolConfig.connectionLimit = 100;

var pool = mysql.createPool(poolConfig);

exports.getPooledConnection = Q.nbind(pool.getConnection, pool);

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

/*

    option configUpdater, might use:

        function(config) {
            config.debug = true;
        }

*/

function getConnection(configUpdater) {

    var config = getConnectionInfo(true);

    if (typeof configUpdater == "function") {
        configUpdater(config);
    }

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


