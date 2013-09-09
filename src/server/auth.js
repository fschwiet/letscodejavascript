
var passport = require('passport');
var Q = require("q");
var url = require('url');
var validator = require('validator');

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

        function handleUserError(message) {
            req.flash("error", message);
            res.render("registerPage", modelFor("register", req));
        }

        var email = req.param("email", null);
        var username = req.param("username", null);
        var password = req.param("password", null);

        var haveClientErrors = false;
        var v = new validator.Validator();
        v.error = function(msg) {
            req.flash("error", msg);
            haveClientErrors = true;
        };

        try {
            v.check(email, "Email should be a valid email address.").isEmail().len(0,255);
            v.check(username, "Username should be letters or digits, maybe a '_' or '-' if you're fancy, and less than 64 characters.").is(/^[a-z0-9_-]{6,64}$/i);
            v.check(password, "Password should be at least 8 characters.").len(8);
        } catch(ignored) {

        }

        if (haveClientErrors) {
            res.render("registerPage", modelFor("register", req));
            return;
        }

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

            var errorString = err.toString();
            if (errorString.indexOf("ER_DUP_ENTRY") > -1) {

                if (errorString.indexOf("friendlyName") > -1) {
                    handleUserError("That username has already been registered on this system.");
                } else if (errorString.indexOf("PRIMARY") > -1) {
                    handleUserError("That email has already been registered on this system.");
                } else {
                    next(err);
                }
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