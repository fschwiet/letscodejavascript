
var GoogleStrategy = require('passport-google');
var passport = require('passport');
var config = require("./config");
var Q = require("q");

var database = require("./database");

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

module.exports = function(port, app) {

    passport.use(new GoogleStrategy.Strategy({
        returnURL: config.urlFor('/auth/google/return'),
        realm: config.urlFor('/')
    }, hydrateUser));

    app.use(passport.initialize());
    app.use(passport.session());

    app.get('/auth/google', function(req,res,next){
        var referer = req.header("referer");

        if (referer !== null) {
            req.session.referer = referer;
        }

        next();
    }, passport.authenticate('google', 
    { 
        successRedirect: '/',
        failureRedirect: '/' 
    }));

    app.get('/auth/google/return', 
      passport.authenticate('google', { failureRedirect: '/' }),
      function(req,res) {
        res.redirect(req.session.referer || '/');
    });

    app.get("/logout", function(req,res) {
        req.logout();
        res.redirect("/");
    });
};

function hydrateUser(identifier, profile, done) {

    console.log("getting connection");
    database.useConnection(function(connection, connectionDone) {

        console.log("wrapping query");
        var query = Q.nbind(connection.query, connection);

        console.log("making query");
        query("SELECT users.id, users.friendlyName FROM users JOIN googleProfiles ON googleProfiles.userId = users.id WHERE googleProfiles.id = ?", identifier)
        .then(function(result) {

            console.log("select result", JSON.stringify(result, null, "    "));

            if (result[0].length > 0) {
                var firstResult = result[0][0];

                done(null, { 
                    id:firstResult.id,
                    friendlyName: firstResult.friendlyName
                });
            }
            else
            {
                return query("INSERT INTO users SET ?", { friendlyName : profile.displayName})
                .then(function(result) {

                    console.log("have first result");
                    var userId = result[0].insertId;

                    console.log("userId", userId);
                    console.log("UserId type", typeof userId);

                    console.log("making next query");
                    return query("INSERT INTO googleProfiles SET ?", {
                        id: identifier,
                        userId: userId,
                        profile: JSON.stringify(profile)
                    })
                    .then(function() {
                        console.log("1");
                        done(null, {
                            id : userId,
                            friendlyName : profile.displayName
                        });
                    });
                });
            }
        })    
        .fin(function() {
            connectionDone();
        })
        .fail(function(err) {
            done(err);
        });
    });
}

module.exports.hydrateUser = hydrateUser;