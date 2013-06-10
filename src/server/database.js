
var mysql = require('mysql');

var nconf = require('./config.js');

function getConnectionInfo(includeDatabasename) {

    var connectionInfo = {
        host     : nconf.get("database_hostname"),
        user     : nconf.get("database_user"),
        password : nconf.get("database_password"),
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


