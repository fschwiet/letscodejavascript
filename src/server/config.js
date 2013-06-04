
var nconf = require('nconf');

nconf.file({ file: 'config.json'});

nconf.defaults({
  "database_hostname" : "localhost",
  "database_name" : "testtemp",
  "database_port" : 13306,
  "database_user" : "root",
  "database_password" : "",
  "testServer_port" : 8081,
  "fileUpload_path" : "./temp/uploads"
});

module.exports = nconf;