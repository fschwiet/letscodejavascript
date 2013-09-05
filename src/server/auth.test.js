
var expect = require("expect.js");

var auth = require("./auth.js");
var config = require("./config.js");

function getRequestWithReferer(referer, existingSessionReferer) {
    return { 
        header : function(name) {
            if (name == 'referer')
                return referer;
            else
                return null;
        },
        session: {
            referer: existingSessionReferer
        }
    };
}

exports["Referer url defaults to homepage"] = function(test) {

    var req = getRequestWithReferer();

    expect(auth.getAfterAuthUrl(req)).to.be('/');

    test.done();
};

exports["Referer url is typically used"] = function(test) {

    var expectedReferer = "http://www.cnn.com/";

    var req = getRequestWithReferer(expectedReferer);

    auth.withLoginPage("/login").handleRefererUrl(req, null, function() {

        expect(auth.getAfterAuthUrl(req)).to.be(expectedReferer);

        test.done();
    });
};

exports["Referer url is ignored when not set"] = function(test) {

    var expectedReferer = "http://www.cnn.com/";

    var req = getRequestWithReferer(null, expectedReferer);

    auth.withLoginPage("/login").handleRefererUrl(req, null, function() {
    
        expect(auth.getAfterAuthUrl(req)).to.be(expectedReferer);

        test.done();
    });
};


exports["Referer url is ignored when it matches the login page"] = function(test) {

    var expectedReferer = "http://www.cnn.com/";

    var req = getRequestWithReferer(config.urlFor("/login", { someQuery : "value"}), null);

    auth.withLoginPage("/login").handleRefererUrl(req, null, function() {

        expect(auth.getAfterAuthUrl(req)).to.be('/');

        test.done();
    });
};
