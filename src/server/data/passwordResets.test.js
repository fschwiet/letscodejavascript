
var assert = require("assert");
var expect = require("expect.js");
var Q = require("q");
var uuid = require("node-uuid");

var database = require("../database.js");
var dataRssUrlStatus = require("./rssUrlStatus.js");
var passwordResets = require("./passwordResets.js");
var users = require("./users.js");

var NodeunitBuilder = require("cauldron").nodeunit;
var scope = new NodeunitBuilder(exports, "meh");

scope.test("Should be able to generate and use a reset guid", function() {

    var email = "someEmail" + uuid() + "@server.com";
    var username = "someUser" + uuid();
    var originalPassword = "oldPassword";
    var newPassword = "newPassword";

    return Q()
    .then(function() {
        return users.createLocalUser(email,username,originalPassword);
    })
    .then(function() {
        return users.findUserByLocalAuth(email, originalPassword);
    })
    .then(function(user) {
        expect(user).not.to.be(null);

        return passwordResets.requestResetId(user.id);
    })
    .then(function(passwordResetId) {

        return passwordResets.useResetId(passwordResetId, newPassword);
    })
    .then(function(success) {
        expect(success).to.be(true);

        return users.findUserByLocalAuth(email, originalPassword);
    })
    .then(function(user) { 
        expect(user).to.be(null);

        return users.findUserByLocalAuth(email, newPassword);
    })
    .then(function(user) {
        expect(user).not.to.be(null);
    });
});

scope.test("Should ignore invalid guids", function() {

    var email = "someEmail" + uuid() + "@server.com";
    var username = "someUser" + uuid();
    var password = "oldPassword";

    return Q()
    .then(function() {
        return users.createLocalUser(email,username,password);
    })
    .then(function() {
        return users.findUserByLocalAuth(email, password);
    })
    .then(function(user) {
        expect(user).not.to.be(null);

        return passwordResets.requestResetId(user.id);
    })
    .then(function(ignoredPasswordResetId) {

        return passwordResets.useResetId(uuid(), uuid());
    })
    .then(function(success) {
        expect(success).to.be(false);

        return users.findUserByLocalAuth(email, password);
    })
    .then(function(user) {
        expect(user).not.to.be(null);
    });
});

scope.test("should limit the number of password reset guids per user", function() {

    var email = "someEmail" + uuid() + "@server.com";
    var username = "someUser" + uuid();
    var password = "oldPassword";

    return Q()
    .then(function() {
        return users.createLocalUser(email,username,password);
    })
    .then(function() {
        return users.findUserByLocalAuth(email, password);
    })
    .then(function(user) {

        var tasks = [];
        var resetIds = [];

        function requestPasswordReset() {
            return passwordResets.requestResetId(user.id)
            .then(function(resetId) {
                resetIds.push(resetId);
            });
        }

        for(var i = 0; i < 6; i++) {
            tasks.push(requestPasswordReset);
        }

        return tasks.reduce(Q.when, Q())
        .then(function() {
            return resetIds;
        });
    })
    .then(function(resetIds) {

        expect(resetIds.length).to.be(6);

        //  We expect the last 5 ids to work, so check the first of six fails and the second succeeds.

        return Q()
        .then(function() {
            return passwordResets.useResetId(resetIds[0], uuid());
        })
        .then(function(result) {
            expect(result).to.be(false);
        })
        .then(function() {
            return passwordResets.useResetId(resetIds[1], uuid());
        })
        .then(function(result) {
            expect(result).to.be(true);
        });
    });
});


scope.test("should only honor password reset guids for 2 hours", function() {

    var email = "someEmail" + uuid() + "@server.com";
    var username = "someUser" + uuid();
    var password = "oldPassword";

    return Q()
    .then(function() {
        return users.createLocalUser(email,username,password);
    })
    .then(function() {
        return users.findUserByLocalAuth(email, password);
    })
    .then(function(user) {

        return passwordResets.requestResetId(user.id)
        .then(function(resetId) {

            return database.getPooledConnection()
            .then(function(connection) {
                return Q.ninvoke(connection, "query", "UPDATE passwordResets SET dateCreated=DATE_ADD(dateCreated, INTERVAL -2 HOUR)")
                .fin(function() {
                    connection.release();
                });
            })
            .then(function() {
                return passwordResets.useResetId(resetId, uuid());
            })
            .then(function(success) {
                expect(success).to.be(false);
            });
        });
    });
});


scope.test("should only honor each password reset guid once", function() {

    var email = "someEmail" + uuid() + "@server.com";
    var username = "someUser" + uuid();
    var password = "oldPassword";

    return Q()
    .then(function() {
        return users.createLocalUser(email,username,password);
    })
    .then(function() {
        return users.findUserByLocalAuth(email, password);
    })
    .then(function(user) {

        return passwordResets.requestResetId(user.id)
        .then(function(resetId) {

            return Q()
            .then(function() {
                return passwordResets.useResetId(resetId, uuid());
            })
            .then(function(success) {
                expect(success).to.be(true);

                return passwordResets.useResetId(resetId, uuid());
            })
            .then(function(success) {
                expect(success).to.be(false);
            });
        });
    });
});

