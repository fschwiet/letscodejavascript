
var nconf = require('nconf');

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
    "isProduction" : false
  };
}

nconf.defaults(getDefaults());

nconf.getDefaults = getDefaults;

module.exports = nconf;

