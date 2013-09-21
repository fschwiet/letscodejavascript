
var bcrypt =require("bcrypt-nodejs");
var Q = require("q");

var database = require('../database.js');

function promiseHashOf(value) {
    return Q.ninvoke(bcrypt, "hash", value, null, null);
}


//
//  Does not include email
//
exports.findOrCreateUserByGoogleIdentifier = function(identifier, profile, callback) {

    return database.getPooledConnection()
    .then(function(connection)
    {
        var query = Q.nbind(connection.query, connection);

        return query("SELECT users.id, users.friendlyName FROM users JOIN googleProfiles ON googleProfiles.userId = users.id WHERE googleProfiles.id = ?", identifier)
        .then(function(result) {

            if (result[0].length > 0) {
                var firstResult = result[0][0];

                callback(null, {
                        id: firstResult.id,
                        friendlyName: firstResult.friendlyName
                    });
            } else {
                return query("INSERT INTO users SET ?", {
                        friendlyName: profile.displayName
                    })
                    .then(function(result) {

                        var userId = result[0].insertId;

                        return query("INSERT INTO googleProfiles SET ?", {
                                id: identifier,
                                userId: userId,
                                profile: JSON.stringify(profile)
                            })
                            .then(function() {
                                callback(null, {
                                        id: userId,
                                        friendlyName: profile.displayName
                                    });
                            });
                    });
            }
        })
        .fin(function() {
            connection.release();
        });
    })
    .fail(function(err) {
        callback(err);
    });
};

exports.createLocalUser = function(email, friendlyName, password) {

    // should be a transaction

    return Q()
    .then(function() {
        return promiseHashOf(password);
    })
    .then(function(passwordHash) {
        return database.getPooledConnection()
        .then(function(connection) {
            return Q()
            .then(function() {
                return Q.ninvoke(connection, "query", "START TRANSACTION");
            })
            .then(function() {
                return Q.ninvoke(connection, "query", "INSERT INTO users SET ?", { friendlyName: friendlyName });
            })
            .then(function(result) {

                var userId = result[0].insertId;

                return Q.ninvoke(connection, "query", "INSERT INTO userPasswords SET ?", {
                    email: email,
                    username: friendlyName,
                    userId: userId,
                    passwordHash: passwordHash
                });
            })
            .then(function() {

                return Q.ninvoke(connection, "query", "COMMIT");
            }, function(err) {

                return Q.ninvoke(connection, "query", "ROLLBACK")
                .then(function() {
                    throw err;
                });
            })
            .fin(function() {
                connection.release();
            });
        });
    });
};


exports.findUserByUsernameOrEmail = function(usernameOrEmail, handler) {

    if (typeof handler == "undefined") {
        handler = function(user,passwordHash) {
            return Q(user);
        };
    }

    return database.getPooledConnection()
    .then(function(connection) {
        // "LEFT JOIN users amiguous" in order to not match any usernames that happen to be
        // someone else's email.

        return Q.ninvoke(connection, "query",
            "SELECT UP.userId, U.friendlyName, UP.email, UP.passwordHash " +
            "FROM userPasswords UP " +
            "JOIN users U ON U.id = UP.userId " +
            "WHERE UP.email = ? OR up.username =? ", [usernameOrEmail,usernameOrEmail])
        .then(function(results) {

            if (results[0].length === 0) {
                return null;
            }

            var result = results[0][0];

            return handler({ id : result.userId, friendlyName : result.friendlyName, email: result.email }, result.passwordHash);
        })
        .fin(function() {
            connection.release();
        });
    });
};


exports.findUserByLocalAuth = function(usernameOrEmail, password) {

    function handleResult(user, passwordHash) {

        return Q.ninvoke(bcrypt, "compare", password, passwordHash)
        .then(function(matched) {

            if (!matched)
                return null;

            return user;
        });
    }

    return exports.findUserByUsernameOrEmail(usernameOrEmail, handleResult);
};


exports.updateUserPassword = function(userId, newPassword) {

    return Q()
    .then(function() {
        return promiseHashOf(newPassword);
    })
    .then(function(passwordHash) {
        return database.getPooledConnection()
        .then(function(connection) {
            return Q.ninvoke(connection, "query", "UPDATE userPasswords SET ? WHERE userId = ?", [{passwordHash: passwordHash}, userId])
            .then(function(queryResults) {
                return queryResults[0].affectedRows > 0;
            })
            .fin(function() {
                connection.release();
            });
        });
    });
};