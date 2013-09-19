
var config = require("./config.js");

module.exports = require("./ex-database.js");

module.exports.getConnectionInfo = function(includeDatabasename) {

    var connectionInfo = {
        host: config.get("database_hostname"),
        user: config.get("database_user"),
        password: config.get("database_password"),
        multipleStatements: true,
        port: config.get("database_port"),
        timezone: 'Z'
    };

    if (includeDatabasename) {
        connectionInfo.database = config.get("database_name");
    }

    return connectionInfo;
};


module.exports.isDatabaseProduction = function() {
    return config.get("isProduction");
};
