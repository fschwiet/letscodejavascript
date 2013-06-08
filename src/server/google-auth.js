
var GoogleStrategy = require('passport-google');
var passport = require('passport');

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

module.exports = function(port, app) {

    passport.use(new GoogleStrategy.Strategy({
        returnURL: 'http://localhost:' + port + '/auth/google/return',
        realm: 'http://localhost:' + port + '/'
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
            console.log("header", req.header);

            if (referer !== null) {
                req.session.referer = referer;
            }

            console.log("have referer", req.session.referer);

            next();
        }, passport.authenticate('google', 
        { 
            successRedirect: '/',
            failureRedirect: '/' 
        }));

    app.get('/auth/google/return', 
      passport.authenticate('google', { successRedirect: '/',
                                        failureRedirect: '/' }));

    app.get("/logout", function(req,res) {
        req.logout();
        res.redirect("/");
    });
};
    
