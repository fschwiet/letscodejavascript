
var mysql = require('mysql');
var hostname = "localhost";


exports.createConnection = function() {
    
    var connection = mysql.createConnection({
      host     : hostname,
      user     : 'root',
      password : '',
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

