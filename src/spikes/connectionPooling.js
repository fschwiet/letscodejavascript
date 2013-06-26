

var mysql = require('mysql');
var Q = require("q");

var nconf = require('../server/config.js');

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

var pool = mysql.createPool(getConnectionInfo(true));

function getConnection()
{
    return Q.ninvoke(pool, "getConnection");
}

/*
function getConnection()
{
    var connection = mysql.createConnection(getConnectionInfo(true));
    connection.connect();
    return connection;
}
*/


Q()
.then(function() {
    return getConnection();
})
.then(function(connection) {

    return Q()
    .then(function() {
        return Q.ninvoke(connection, "query", "CREATE TEMPORARY TABLE foo (id INT, data VARCHAR(100))");
    })
    .then(function() {
        return Q.ninvoke(connection, "query", "INSERT INTO foo(id, data) VALUES (1, 'foo')");
    })
    .then(function() {
        return Q.ninvoke(connection, "query", "SELECT * FROM foo");
    })
    .then(function(results) {
        console.log("firstResult", results[0]);
    })
    .fin(function() {
        connection.end();
    });
})
.then(function() {
    return getConnection();
})
.then(function(connection2) {

    return Q()
    .then(function() {
        return Q.ninvoke(connection2, "query", "SELECT * FROM foo");
    })
    .then(function(results) {
        console.log("secondResult", results[0]);
    })
    .fin(function() {
        connection2.end();
    });

})
.then(function() {
    console.log("success");
}, function(err) {
    console.log("err", err);
});


