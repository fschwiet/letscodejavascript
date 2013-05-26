
var mysql = require('mysql');

var nconf = require('nconf');

nconf.argv(["database_port"]);

nconf.file({ file: 'config.json'});

nconf.defaults({
  "database_hostname" : "localhost",
  "database_name" : "testtemp",
  "database_port" : 13306,
  "database_user" : "root",
  "database_password" : "",
});

var hostname = nconf.get("database_hostname");
var databaseName = nconf.get("database_name");
var port = nconf.get("database_port");
var username = nconf.get("database_user");
var password = nconf.get("database_password");

console.log("using port " + port);

exports.ensureTestDatabaseIsClean = function(callback) {
    var connection = mysql.createConnection({
      host     : hostname,
      user     : username,
      password : password,
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
      user     : username,
      password : password,
      database : databaseName,
      port: port
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



