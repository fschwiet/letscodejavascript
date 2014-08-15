var assert = require("assert");
var nconf = require("nconf");
var config = require("./config.js");

var NodeunitBuilder = require("cauldron").nodeunit;


var originalPort;
var originalHostname;

var context = NodeunitBuilder.createTestScopeExtender("modifying config temporarily", 
    function(done) {

        originalPort = nconf.get("server_external_port");
        originalHostname = nconf.get("server_hostname");
        done();
    }, 
    function(done) {

        nconf.set("server_external_port", originalPort);        
        nconf.set("server_hostname", originalHostname);        
        done();
    })(exports);




context.test("can generate url, optionally with querystring", function() {

    nconf.set("server_hostname", "example.org");
    nconf.set("server_external_port", 80);

    assert.equal(config.urlFor("/path"), "http://example.org/path");

    nconf.set("server_external_port", 8081);

    assert.equal(config.urlFor("/path", { foo: "bar"}), 
        "http://example.org:8081/path?foo=bar");
});