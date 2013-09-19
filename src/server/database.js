var fs = require("fs");
var mysql = require('mysql');
var path = require("path");
var Q = require("q");

var nconf = require('./config.js');
var spawnProcess = require('cauldron').spawnProcess;

var poolConfig = getConnectionInfo(true);
poolConfig.connectionLimit = 70; // 100 is the default connection limit for MySQL.  Using <100 since not everyone uses the pool.

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

function runMigrations(tempPath, parameters) {

    var connectionInfo = getConnectionInfo(true);

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

exports.runMigrations = runMigrations;

