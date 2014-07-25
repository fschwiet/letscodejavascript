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
        "server_hostname": "localhost",
        "server_sessionKey": "foo",
        "is_production": true,

        "googleTest_username": null,
        "googleTest_password": null,

        "deployment_configFile": "production.config.json",
        "deployment_smoketestPort": 8082,
        "deployment_basePath": "c:/inetpub/letscodejavascript",

        "smtp_host": "localhost",               // "oxmail.registrar-servers.com"
        "smtp_port": 8083,                      // 465
        "smtp_useSSL": false,                   // true
        "smtp_username": null,    // support@asimplereader.com
        "smtp_password": null,

        "support_email": "support@asimplereader.com"
    };
}

nconf.defaults(getDefaults());

var conf = {};

conf.get = function() {
    return nconf.get.apply(nconf, arguments);
};

conf.getDefaults = getDefaults;

var baseUrl = "http://" + conf.get("server_hostname") + ":" + conf.get("server_port") + "/";

conf.urlFor = function(path, query) {
    var parts = urlParser.parse(baseUrl);
    parts.pathname = path;
    parts.query = query;
    return urlParser.format(parts);
};

conf.isProduction = function() {
    return nconf.get("is_production");    
};

module.exports = conf;