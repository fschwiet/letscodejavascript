var config = require("./config.js");

exports["can generate url, optionally with querystring"] = function(test) {
    test.equal(config.urlFor("/path"), "http://" + config.get("server_hostname") + ":" + config.get("server_port") + "/path");
    test.equal(config.urlFor("/path", {
                foo: "bar"
            }), "http://" + config.get("server_hostname") + ":" + config.get("server_port") + "/path?foo=bar");
    test.done();
};