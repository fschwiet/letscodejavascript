
var Q = require("q");
var uuid = require("node-uuid");

var database = require("../database.js");
var users = require("./users.js");

exports.requestResetId = function(userId) {

    var newId = uuid();

    return database.getPooledConnection()
    .then(function(connection) {
        return Q.ninvoke(connection, "query", "INSERT INTO passwordResets SET ?", [{uuid:newId, userId:userId}])
        .then(function() {
            return Q.ninvoke(connection, "query", "SELECT id FROM passwordResets WHERE userId = ? ORDER BY id DESC LIMIT 4,1", [userId, userId]);
        })
        .then(function(idCutoffResult) {

            if (idCutoffResult[0].length > 0) {
                var idCutoff = idCutoffResult[0][0].id;

                return Q.ninvoke(connection, "query", "DELETE FROM passwordResets WHERE userId = ? and id < ?", [userId, idCutoff]);
            }
        })
        .then(function() {
            return newId;
        })
        .fin(function() {
            connection.release();
        });     
    });
};

exports.useResetId = function(resetId, newPassword) {

    return database.getPooledConnection()
    .then(function(connection) {
        return Q.ninvoke(connection, "query", "SELECT U.id FROM passwordResets PR JOIN users U ON U.id = PR.userId WHERE PR.uuid = ? AND PR.dateCreated > DATE_ADD(NOW(), INTERVAL -2 HOUR)", [resetId])
        .then(function(results) {

            if (results[0].length === 0) {
                return false;
            }

            var userId = results[0][0].id;

            return Q.ninvoke(connection, "query", "DELETE FROM passwordResets WHERE uuid = ?", [resetId])
            .fin(function() {
                connection.release();
            })            
            .then(function() {
                return users.updateUserPassword(userId, newPassword);
            });
        });
    });
};
