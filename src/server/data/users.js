
var bcrypt =require("bcrypt-nodejs");
var Q = require("q");

var database = require('../database.js');

function promiseHashOf(value) {
    return Q.ninvoke(bcrypt, "hash", value, null, null);
}


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
            connection.end();
        });
    })
    .fail(function(err) {
        callback(err);
    });
};

exports.createLocalUser = function(email, friendlyName, password) {

    return Q()
    .then(function() {
        return promiseHashOf(password);
    })
    .then(function(passwordHash) {
        return database.getPooledConnection()
        .then(function(connection) {
            var query = Q.nbind(connection.query, connection);

            return Q.ninvoke(connection, "query", "INSERT INTO users SET ?", { friendlyName: friendlyName })
            .then(function(result) {

                var userId = result[0].insertId;

                return Q.ninvoke(connection, "query", "INSERT INTO userPasswords SET ?", {
                    email: email,
                    userId: userId,
                    passwordHash: passwordHash
                });
            })
            .fin(function() {
                connection.end();
            });
        });
    });
}


exports.findUserByLocalAuth = function(usernameOrEmail, password) {

    return database.getPooledConnection()
    .then(function(connection) {
        // "LEFT JOIN users amiguous" in order to not match any usernames that happen to be
        // someone else's email.

        return Q.ninvoke(connection, "query",
            "SELECT UP.userId, U.friendlyName, UP.passwordHash " +
            "FROM userPasswords UP " +
            "JOIN users U ON U.id = UP.userId " +
            "LEFT JOIN userPasswords ambiguous ON ambiguous.email = U.friendlyName " +
            "WHERE UP.email = ? OR (U.friendlyName = ? AND ambiguous.userId IS NULL) ", [usernameOrEmail,usernameOrEmail])
        .then(function(results) {

            if (results[0].length === 0) {
                return null;
            }

            var result = results[0][0];

            return Q.ninvoke(bcrypt, "compare", password, result.passwordHash)
            .then(function(matched) {

                if (!matched)
                    return null;

                return {
                    id : result.userId,
                    friendlyName : result.friendlyName
                };
            });
        })
        .fin(function() {
            connection.end();
        });
    });
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
                connection.end();
            });
        });
    });
};