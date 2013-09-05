
var url = require('url');

exports.withLoginPage = function(loginPath) {
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
};

function getAfterAuthUrl(req) {
    return req.session.referer || '/';
}

exports.getAfterAuthUrl = getAfterAuthUrl;

exports.getAuthHandler = function(req, res, next) {
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
};