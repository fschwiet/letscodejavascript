
var Q = require("q");
var uuid = require("node-uuid");

var database = require("../database.js");
var users = require("./users.js");

exports.requestResetId = function(userId) {

    var newId = uuid();

    return database.getPooledConnection()
    .then(function(connection) {
        return Q.ninvoke(connection, "query", "INSERT INTO passwordResets SET ?", [{id:newId, userId:userId}])
        .then(function() {
            return newId;
        })
        .fin(function() {
            connection.end();
        });     
    });
};

exports.useResetId = function(resetId, newPassword) {

    return database.getPooledConnection()
    .then(function(connection) {
        return Q.ninvoke(connection, "query", "SELECT U.id FROM passwordResets PR JOIN users U ON U.id = PR.userId WHERE PR.id = ?", [resetId])
        .then(function(results) {

            if (results[0].length == 0) {
                return false;
            }

            var userId = results[0][0].id;

            return users.updateUserPassword(userId, newPassword);
        })
        .fin(function() {
            connection.end();
        });     
    });
};
