
var mysql = require('mysql');

var nconf = require('./config.js');

nconf.defaults({
  "database_hostname" : "localhost",
  "database_name" : "testtemp",
  "database_port" : 13306,
  "database_user" : "root",
  "database_password" : "",
});

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

    var connection = mysql.createConnection(getConnectionInfo());

    connection.connect();

    connection.query(
      "DROP DATABASE IF EXISTS testtemp; CREATE DATABASE testtemp;", function(err, rows, fields) {
        callback(err);
      });

    connection.end();
};

exports.getStatus = function(callback) {

    var config = getConnectionInfo(true);

    var connection = mysql.createConnection(config);

    connection.connect();

    connection.query("SELECT version()", function(err, rows, fields) {

        if (err) {
            callback(err.toString() + " (" + config.host + ")");
        } else {
            callback("connected (" + config.host + ")");
        }
    });

    connection.end();
};



