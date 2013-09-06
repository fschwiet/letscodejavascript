var GoogleStrategy = require('passport-google');
var LocalStrategy = require('passport-local').Strategy;

var passport = require('passport');
var config = require("./config");
var Q = require("q");

var auth = require("./auth.js");
var users = require("./data/users.js");
var modelFor = require("./modelFor.js");
var users = require("./data/users.js");

module.exports = function(port, app) {

    passport.serializeUser(function(user, done) {
        done(null, user);
    });

    passport.deserializeUser(function(obj, done) {
        done(null, obj);
    });

    passport.use(new LocalStrategy(
        function(username, password, done) {

            users.findUserByLocalAuth(username, password)
            .then(function(user) {

                if (user !== null) {
                    done(null, user);
                } else {
                    done(null, false, {message: 'Incorrect username or password'});
                }
            }, function(err) {
                done(err);
            });
        }
    ));

    passport.use(new GoogleStrategy.Strategy({
                returnURL: config.urlFor('/auth/google/return'),
                realm: config.urlFor('/')
            }, users.findOrCreateUserByGoogleIdentifier));

    app.use(passport.initialize());
    app.use(passport.session());

    app.get("/login", 
        auth.withLoginPage("/login").handleRefererUrl, 
        function(req, res) {
            res.render('loginPage', modelFor("login", req));
        });

    app.get("/logout", function(req, res) {
        req.logout();
        res.redirect("/");
    });

    app.post('/auth/local', 
        function(req,res,next) {
            passport.authenticate('local', auth.getAuthHandler(req,res,next))(req,res,next);
        });

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
};
