
var nodemailer = require("nodemailer");
var passport = require('passport');
var Q = require("q");
var url = require('url');
var util = require("util");
var validator = require('validator');

var GoogleStrategy = require('passport-google');
var LocalStrategy = require('passport-local').Strategy;

var config = require("./config");
var users = require("./data/users.js");
var modelFor = require("./modelFor.js");
var users = require("./data/users.js");
var passwordResets = require("./data/passwordResets.js");


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
        function(req, res) {
            res.render('accounts/loginPage', modelFor("login", req));
        });

    app.get("/register", function(req,res){
        res.render('accounts/registerPage', modelFor("register", req));
    });

    app.post("/register", function(req,res,next) {

        function handleUserError(message) {
            req.flash("error", message);
            res.render("accounts/registerPage", modelFor("register", req));
        }

        var email = req.param("email", null);
        var username = req.param("username", null);
        var password = req.param("password", null);
        var retypedPassword = req.param("retypedPassword", null);

        var haveClientErrors = false;
        var v = new validator.Validator();
        v.error = function(msg) {
            req.flash("error", msg);
            haveClientErrors = true;
        };

        try {
            v.check(email, "Email should be a valid email address.").isEmail().len(0,255);
            v.check(username, "Username should be letters or digits, maybe a '_' or '-' character.  The username should be less than 64 characters.").is(/^[a-z0-9_\-]{6,64}$/i);
            v.check(password, "Password should be at least 8 characters.").len(8);
        } catch(ignored) {

        }

        if (haveClientErrors) {
            res.render("accounts/registerPage", modelFor("register", req));
            return;
        }

        if (password != retypedPassword) {
            handleUserError("Please type the password twice for verification.");
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

                if (errorString.indexOf("idx_userspasswords_username") > -1) {
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

    app.get("/resetPassword", function(req,res) {
        res.render("accounts/resetPasswordPage", modelFor("Reset your Password", req));
    });

    app.post("/resetPassword", function(req,res,next) {

        var usernameOrEmail = req.param("usernameOrEmail", null);

        users.findUserByUsernameOrEmail(usernameOrEmail, function(user) {
            return Q(user);
        })
        .then(function(user) {
            return passwordResets.requestResetId(user.id)
            .then(function(resetId) {
                return {
                    email: user.email,
                    resetUrl: config.urlFor("/resetPassword/" + resetId)
                };
            });
        })
        .then(function(context) {

            var transportConfig = {
                host: config.get("smtp_host"),
                secureConnection: config.get("smtp_useSSL"),
                port: config.get("smtp_port")
            };    

            var smtpUsername = config.get("smtp_username"), smtpPassword = config.get("smtp_password");

            if (smtpUsername !== null || smtpPassword !== null) {
                transportConfig.auth = {
                    user: config.get("smtp_username"),
                    pass: config.get("smtp_password")
                };
            }

            var transport = nodemailer.createTransport("SMTP", transportConfig);

            var body = util.format("A password request was requested for your account at %s.  Please follow this link to reset your password: %s.", 
                    config.get("server_friendlyName"), 
                    context.resetUrl);

            var sendMailParameters = {
                to: context.email,
                from: config.get("server_friendlyName") + " <" + config.get("support_email") + ">",
                subject: "your password reset request",
                text: body
            };

            Q.ninvoke(transport, "sendMail", sendMailParameters)
            .then(function(r) {
                req.flash("info", "A password reset email has been sent.  If you do not receive it shortly, check your spam folder.");
                res.render("accounts/resetPasswordPage", modelFor("Reset your Password", req));
            })
            .fail(function(err) {
                next(err);
            });
        })
        .fail(function(err) {
            next(err);
        });
    });

    app.get("/resetPassword/*", function(req,res) {

        var resetId = req.param[0];

        res.render("accounts/resetPasswordPage2", modelFor("Choose a New Password", req));
    });

    app.post("/resetPassword/:uuid", function(req,res,next) {

        var resetId = req.param("uuid", null);
        var password = req.param("newPassword", null);
        var passwordConfirmation = req.param("newPasswordConfirmation", null);

        if (password != passwordConfirmation) {
            req.flash("error", "To ensure we have the right password, it must be typed twice.");
            res.render("accounts/resetPasswordPage2", modelFor("Choose a New Password", req));
            return;
        }

        passwordResets.useResetId(resetId, password)
        .then(function(result) {

            if (result) {
                req.flash("info", "Your password has be reset.");
                res.redirect("/login");
            } else {
                req.flash("info", "The password reset link you have turns out to be invalid- perhaps it expired.  You'll need to request another one.");
                res.redirect("/resetPassword");
            }
        })
        .fail(function(err) {
            next(err);
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
        passport.authenticate('google', {
            successRedirect: '/',
            failureRedirect: '/'
        }));

    app.get('/auth/google/return', 
        function(req,res,next) {
            passport.authenticate('google', authHandler(req,res,next))(req,res,next);
        });
};

exports.requireLogin = function(request,response,next) {
    if (typeof request.user !== "object") {
        request.session.referer = request.url;
        request.flash("info", "You need to log in first");
        response.redirect("/login");
    } else {
        next();
    }
};
