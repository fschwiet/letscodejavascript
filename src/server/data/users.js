
var bcrypt =require("bcrypt-nodejs");
var Q = require("q");

var database = require('../database.js');


exports.findOrCreateUserByGoogleIdentifier = function(identifier, profile, callback) {

    var connection = database.getConnection();

    var query = Q.nbind(connection.query, connection);

    query("SELECT users.id, users.friendlyName FROM users JOIN googleProfiles ON googleProfiles.userId = users.id WHERE googleProfiles.id = ?", identifier)
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
        })
        .fail(function(err) {
            callback(err);
        });
};

exports.createLocalUser = function(email, friendlyName, password) {

    var deferred = Q.defer();

    bcrypt.hash(password, null, null, deferred.makeNodeResolver());

    return deferred.promise
    .then(function(passwordHash) {
        var connection = database.getConnection();

        var query = Q.nbind(connection.query, connection);

        return query("INSERT INTO users SET ?", { friendlyName: friendlyName })
        .then(function(result) {

            var userId = result[0].insertId;

            return query("INSERT INTO userPasswords SET ?", {
                email: email,
                userId: userId,
                passwordHash: passwordHash
            });
        });
    });
};


exports.findUserByLocalAuth = function(usernameOrEmail, password) {

    var connection = database.getConnection();

    // "LEFT JOIN users amiguous" in order to not match any usernames that happen to be
    // someone else's email.

    return Q.npost(connection, "query", [
        "SELECT UP.userId, U.friendlyName, UP.passwordHash " +
        "FROM userPasswords UP " +
        "JOIN users U ON U.id = UP.userId " +
        "LEFT JOIN userPasswords ambiguous ON ambiguous.email = U.friendlyName " +
        "WHERE UP.email = ? OR (U.friendlyName = ? AND ambiguous.userId IS NULL) ", [usernameOrEmail,usernameOrEmail]])
    .then(function(results) {

        if (results[0].length === 0) {
            return null;
        }

        var result = results[0][0];

        var deferred = Q.defer();

        bcrypt.compare(password, result.passwordHash, deferred.makeNodeResolver());

        return deferred.promise
        .then(function(matched) {

            if (!matched)
                return null;

            return {
                id : result.userId,
                friendlyName : result.friendlyName
            };
        });
    });
};
