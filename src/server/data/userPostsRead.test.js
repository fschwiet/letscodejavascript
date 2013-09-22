
var assert = require("assert");
var Q = require("q");
var uuid = require("node-uuid");

var database = require("../database.js");
var dataUserPostsRead = require("./userPostsRead.js");
var users = require("./users.js");

var setup = require("../../test/setup.js");
var findOrCreateUserByGoogleIdentifier = Q.nbind(users.findOrCreateUserByGoogleIdentifier);

var addTest = require("cauldron").nodeunit.addTest;

addTest(exports, "markPostAsRead shouldn't insert duplicates", function() {

    return findOrCreateUserByGoogleIdentifier(uuid(), setup.getGoogleProfile("Other"))
    .then(function(user) {
        return dataUserPostsRead.markPostAsRead(user.id, "http://someurl.com/")
        .then(function() {
            return dataUserPostsRead.markPostAsRead(user.id, "http://someurl.com/");
        })
        .then(function() {

            var connection = database.getConnection();

            return Q.ninvoke(connection, "query", "SELECT COUNT(*) AS count FROM userPostsRead WHERE userId = ?", [user.id])
            .then(function(results) {

                assert.deepEqual(results[0], [{count:1}]);
            })
            .fin(function() {

                connection.end();
            });                
        });
    });
});