
var GoogleStrategy = require('passport-google');
var passport = require('passport');
var config = require("./config");

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
    }, function(identifier, profile, done) {
        return done(null, {
            id : identifier,
            googleProfile: profile
        });
    }));

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
    
