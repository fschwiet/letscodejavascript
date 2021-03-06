var fs = require('fs');
var nconf = require('nconf');
var path = require("path");
var url = require("url");

nconf.file({
        file: __dirname + '/../config.json'
    });

function getDefaults() {
    return {
        "database_hostname": "192.168.33.100",
        "database_name": "testtemp",
        "database_port": 3306,
        "database_user": "root",
        "database_password": "password",

        "server_friendlyName": "letscodejavascript",
        "server_hostname": "localhost",
        "server_internal_port": 8081,
        "server_external_port": 8081,
        "server_sessionKey": "foo",
        "is_production": true,

        "google_api_client_id": "17269552488-r2morqk5d792hhmhlfvhjghfe9jig6ki.apps.googleusercontent.com", // domain-specific, https://console.developers.google.com/project
        "google_api_client_secret": "FxokeurIyCbHc5-NknhYqf6z",

        "smtp_host": "localhost",               // "oxmail.registrar-servers.com"
        "smtp_port": 8083,                      // 465
        "smtp_useSSL": false,                   // true
        "smtp_username": null,    // support@asimplereader.com
        "smtp_password": null,

        "support_email": "support@asimplereader.com",

        //  The following options are only used from development environments, not production:

        "googleTest_username": null,
        "googleTest_password": null,

        "fakeServer_hostName": "localhost",
        "fakeServer_port": 8084,

        "vagrant_provider": null,

        "vagrant_hostGitUrl": "https://github.com/fschwiet/cumulonimbus-host",
        "vagrant_hostGitCommit": "master",
        "vagrant_wwwuserUsername": "wwwuser",
        "vagrant_wwwuserPassword": "password",

        "digitalOceanPrivateKeyPath": null,
        "digitalOceanProviderToken": null
    };
}

nconf.defaults(getDefaults());

var configFile = process.env["config-json"];

if (typeof configFile == 'string') {

    var vagrantConfigOverrides = require(path.resolve(configFile));

    for(var key in vagrantConfigOverrides) {
        if (vagrantConfigOverrides.hasOwnProperty(key)) {
            nconf.set(key, vagrantConfigOverrides[key]);
        }
    }
}

var config = { getDefaults: getDefaults };

config.get = function() {
    return nconf.get.apply(nconf, arguments);
};

config.isVagrantEnvironment = function() {
    return config.get("vagrant_provider") !== null;
};

function commonUrlParameters(path, query) {

    var port = config.get("server_external_port");
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