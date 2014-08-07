var nconf = require('nconf');
var url = require("url");
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

        "fakeServer_hostName": "127.0.0.76",
        "fakeServer_port": 8081,

        "google_api_client_id": null, // https://console.developers.google.com/project
        "google_api_client_secret": null,

        "googleTest_username": null,
        "googleTest_password": null,

        "smtp_host": "localhost",               // "oxmail.registrar-servers.com"
        "smtp_port": 8083,                      // 465
        "smtp_useSSL": false,                   // true
        "smtp_username": null,    // support@asimplereader.com
        "smtp_password": null,

        "support_email": "support@asimplereader.com"
    };
}

nconf.defaults(getDefaults());

var config = {};

config.get = function() {
    return nconf.get.apply(nconf, arguments);
};

config.getDefaults = getDefaults;

function commonUrlParameters(path, query) {

    var port = config.get("server_port");
    port = port == 80 ? null : port;

    return {
        protocol: 'http',
        hostname: config.get("server_hostname"),
        port: port,
        pathname: path,
        query: query
    };
}

config.urlFor = function(path, query) {

    var urlParams = commonUrlParameters(path, query);

    return url.format(urlParams);
};

config.isProduction = function() {
    return nconf.get("is_production");    
};

module.exports = config;