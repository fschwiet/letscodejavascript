
var nconf = require('nconf');
var urlParser = require("url");

nconf.file({ file: __dirname + '/../../config.json'});

function getDefaults() {
  return {
    "database_hostname" : "localhost",
    "database_name" : "testtemp",
    "database_port" : 3306,
    "database_user" : "root",
    "database_password" : "",
    "testServer_port" : 8081,
    "fileUpload_path" : "./temp/uploads",
    "sessionKey" : "foo",
    "isProduction" : false,
    "googleTest_username" : null,
    "googleTest_password" : null
  };
}

nconf.defaults(getDefaults());

nconf.getDefaults = getDefaults;

var baseUrl = "http://localhost:" + nconf.get("testServer_port") + "/";

nconf.urlFor = function(path) {
    var parts = urlParser.parse(baseUrl);
    parts.pathname = path;
    return urlParser.format(parts);
};

module.exports = nconf;

