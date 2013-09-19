
var fs = require("fs");
var mysql = require('mysql');
var path = require("path");
var Q = require("q");

var spawnProcess = require('./spawn-process.js');

var poolConfig = null;
var pool = null;

module.exports = {
    getConnectionInfo: function(includeDatabasename) {
        throw new Error("getConnectionInfo needs to be defined for this project.");
    },
    isDatabaseProduction: function() {
        throw new Error("isDatabaseProduction needs to be defined for this project.");
    },
    ensureTestDatabaseIsClean: ensureTestDatabaseIsClean,
    emptyDatabase: emptyDatabase,
    getStatus: getStatus,
    getPooledConnection: getPooledConnection,
    getConnection: getConnection,
    useConnection: useConnection,
    runMigrations: runMigrations
};


function getPooledConnection() {

    if (poolConfig === null) {

        poolConfig = module.exports.getConnectionInfo(true);
        poolConfig.connectionLimit = 70; // 100 is the default connection limit for MySQL.  Using <100 since not everyone uses the pool.

        pool = mysql.createPool(poolConfig);
    }

    return Q.ninvoke(pool, "getConnection");
}

function assertDatabaseIsNotProduction(name) {

    if (module.exports.isDatabaseProduction() !== false) {
        throw new Error("Attempted to call " + name + " against a database is production environment.");
    }
}


function ensureTestDatabaseIsClean(callback) {

    assertDatabaseIsNotProduction("ensureTestDatabaseIsClean");

    var connection = mysql.createConnection(module.exports.getConnectionInfo());

    connection.connect();

    connection.query(
        "DROP DATABASE IF EXISTS testtemp; CREATE DATABASE testtemp;", function(err, rows, fields) {
            callback(err);
        });

    connection.end();
}


function emptyDatabase(callback) {

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
}


function getStatus(callback) {

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
}

function getConnection(configUpdater) {

    var config = module.exports.getConnectionInfo(true);

    if (typeof configUpdater == "function") {
        configUpdater(config);
    }

    var connection = mysql.createConnection(config);

    connection.connect();

    return connection;
}

function useConnection(callback) {

    var connection = getConnection();

    callback(connection, function() {
        connection.end();
    });
}


function runMigrations(tempPath, parameters) {

    var connectionInfo = module.exports.getConnectionInfo(true);

    var databaseMigrationConfig = path.resolve(tempPath, "database.json");

    fs.writeFileSync(databaseMigrationConfig, JSON.stringify({
                "db": {
                    "driver": "mysql",
                    "user": connectionInfo.user,
                    "password": connectionInfo.password,
                    "host": connectionInfo.host,
                    "port": connectionInfo.port,
                    "database": connectionInfo.database
                }
            }, null, "    "));

    var builtParameters = ["./node_modules/db-migrate/bin/db-migrate"];

    builtParameters = builtParameters.concat.apply(builtParameters, parameters);
    builtParameters = builtParameters.concat.apply(builtParameters, ["--config", databaseMigrationConfig, "--env=db", "--migrations-dir", "./src/migrations"]);

    return spawnProcess("node", builtParameters, {
        env: process.env
    })
    .then(function() {
        fs.unlinkSync(databaseMigrationConfig);
    });
}

