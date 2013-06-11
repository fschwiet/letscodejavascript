var nconf = require('nconf');
var urlParser = require("url");
var path = require("path");

nconf.file({
        file: __dirname + '/../../config.json'
    });

function getDefaults() {
    return {
        "database_hostname": "localhost",
        "database_name": "testtemp",
        "database_port": 3306,
        "database_user": "root",
        "database_password": "",

        "server_friendlyName": "letscodejavascript",
        "server_port": 8081,
        "server_tempPath" : "./temp",
        "server_sessionKey": "foo",
        "isProduction": false,
        
        "googleTest_username": null,
        "googleTest_password": null,

        "deployment_configFile": "production.config.json",
        "deployment_port": 80,
        "deployment_smoketestPort": 8082,
        "deployment_basePath": "c:/inetpub/letscodejavascript"
    };
}

nconf.defaults(getDefaults());

nconf.getDefaults = getDefaults;

var baseUrl = "http://localhost:" + nconf.get("server_port") + "/";

nconf.urlFor = function(path) {
    var parts = urlParser.parse(baseUrl);
    parts.pathname = path;
    return urlParser.format(parts);
};

nconf.tempPathFor = function(subpath) {
    return path.resolve(nconf.get("server_tempPath"), subpath);
};

nconf.tempPathForLogs = function() { return nconf.tempPathFor("logs"); };
nconf.tempPathForUploads = function() { return nconf.tempPathFor("uploads"); };

module.exports = nconf;