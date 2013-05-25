
var mysql = require('mysql');
var hostname = "localhost";


exports.createConnection = function() {
    
    var connection = mysql.createConnection({
      host     : hostname,
      user     : 'me',
      password : 'secret',
    });

    connection.connect();
    return connection;
};

exports.getStatus = function(callback) {

    var connection = exports.createConnection();

    connection.query("SELECT Version()", function(err, rows, fields) {

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

