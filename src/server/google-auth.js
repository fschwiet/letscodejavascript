
var passport = require('passport');
var GoogleStrategy = require('passport-google');

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

passport.use(new GoogleStrategy.Strategy({
    returnURL: 'http://127.0.0.3/auth/google/return',
    realm: 'http://127.0.0.3/'
}, function(identifier, profile, done) {
    return done(null, {
        id : identifier,
        googleProfile: profile
    });
}));

module.exports = function(app) {
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
    
