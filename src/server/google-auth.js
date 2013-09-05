var GoogleStrategy = require('passport-google');
var passport = require('passport');
var config = require("./config");
var Q = require("q");

var auth = require("./auth.js");
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
            }, database.findOrCreateUserByGoogleIdentifier));

    app.use(passport.initialize());
    app.use(passport.session());

    app.get('/auth/google', 
        auth.withLoginPage("/login").handleRefererUrl, 
        passport.authenticate('google', {
            successRedirect: '/',
            failureRedirect: '/'
        }));

    app.get('/auth/google/return', 
        function(req,res,next) {
            passport.authenticate('google', auth.getAuthHandler(req,res,next))(req,res,next);
        });

    app.get("/logout", function(req, res) {
        req.logout();
        res.redirect("/");
    });
};
