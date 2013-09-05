
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

exports.getAfterAuthUrl = function(req) {
    return req.session.referer || '/';
};
