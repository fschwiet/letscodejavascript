
var passport = require('passport');
var Q = require("q");
var url = require('url');

var GoogleStrategy = require('passport-google');
var LocalStrategy = require('passport-local').Strategy;

var config = require("./config");
var users = require("./data/users.js");
var modelFor = require("./modelFor.js");
var users = require("./data/users.js");


function withLoginPage(loginPath) {
    return {
        //
        //  We ignore the referer header if its missing or matches our login page.
        //
        handleRefererUrl: function(req, res, next) {
            var referer = req.header("referer");

            if (typeof referer == 'string') {

                var parsedReferer = url.parse(referer);

                if (parsedReferer.pathname != loginPath) {

                    req.session.referer = referer;
                }
            }

            next();
        }        
    };
}

exports.withLoginPage = withLoginPage;

function getAfterAuthUrl(req) {
    return req.session.referer || '/';
}

exports.getAfterAuthUrl = getAfterAuthUrl;

function authHandler(req, res, next) {
    return function (err, user, info) {
        if (err) {
            return next(err);
        }

        if (typeof info == 'object' && 'message' in info) {
            req.flash('info', info.message);
        }

        if (!user) {
            return res.redirect('/login');
        }

        req.logIn(user, function(err) {
            if (err) { return next(err); }
            return res.redirect(getAfterAuthUrl(req));
        });
    };
}

exports.addToExpress = function(port, app) {

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
        withLoginPage("/login").handleRefererUrl, 
        function(req, res) {
            res.render('loginPage', modelFor("login", req));
        });

    app.get("/register", function(req,res){
        res.render('registerPage', modelFor("register", req));
    });

    app.post("/register", function(req,res,next) {

        var email = req.param("email", null);
        var username = req.param("username", null);
        var password = req.param("password", null);

        users.createLocalUser(email,username,password)
        .then(function() {
            return users.findUserByLocalAuth(email,password)
            .then(function(user) {

                return Q.ninvoke(req, "login", user)
                .then(function() {
                    res.redirect(getAfterAuthUrl(req));
                });
            });
        })
        .fail(function(err){

                console.log("/register error", err);
            var errorString = err.toString();
            if (errorString.indexOf("ER_DUP_ENTRY") > -1) {

                if (errorString.indexOf("friendlyName") > -1) {
                    req.flash("info", "That username has already been registered on this system.");
                } else {
                    req.flash("info", "That email has already been registered on this system.");
                }

                res.redirect("/login");
            } else {
                next(err);
            }
        });
    });

    app.get("/logout", function(req, res) {
        req.logout();
        res.redirect("/");
    });

    app.post('/auth/local', 
        function(req,res,next) {
            passport.authenticate('local', authHandler(req,res,next))(req,res,next);
        });

    app.get('/auth/google', 
        withLoginPage("/login").handleRefererUrl, 
        passport.authenticate('google', {
            successRedirect: '/',
            failureRedirect: '/'
        }));

    app.get('/auth/google/return', 
        function(req,res,next) {
            passport.authenticate('google', authHandler(req,res,next))(req,res,next);
        });
};