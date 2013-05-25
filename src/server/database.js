
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

/*
connection.query('SELECT 1 + 1 AS solution', function(err, rows, fields) {
  if (err) throw err;

  console.log('The solution is: ', rows[0].solution);
});

connection.end();
*/