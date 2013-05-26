
var mysql = require('mysql');
var hostname = "localhost";
var databaseName = "testtemp";
var port = 13306;

exports.ensureTestDatabaseIsClean = function(callback) {
    var connection = mysql.createConnection({
      host     : hostname,
      user     : 'root',
      multipleStatements: true,
      port: port
    });

    connection.connect();

    connection.query(
      "DROP DATABASE IF EXISTS testtemp; CREATE DATABASE testtemp;", function(err, rows, fields) {
        callback(err);
      });

    connection.end();
};

exports.createConnection = function() {
    
    var connection = mysql.createConnection({
      host     : hostname,
      user     : 'root',
      database : databaseName,
      port: 13306
    });

    connection.connect();
    return connection;
};

exports.getStatus = function(callback) {

    var connection = exports.createConnection();

    connection.query("SELECT version()", function(err, rows, fields) {

        if (err) {
            callback(err.toString() + " (" + hostname + ")");
        } else {
            console.log("rows: " + rows);
            console.log("fields: " + fields);

            callback("connected (" + hostname + ")");
        }
    });

    connection.end();
};



