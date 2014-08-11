
var fs = require("fs");
var path = require("path");
var Q = require("q");
var vagrant = require("vagrant");

module.exports = vagrant;

var config = require("./config.js");

var Ssh2Connection = require("ssh2");

vagrant.start = path.resolve("./host");
vagrant.env = JSON.parse(JSON.stringify(vagrant.env));

vagrant.env.syncedFolder = "..";
vagrant.env.hostGitUrl = config.get("vagrant_hostGitUrl");
vagrant.env.hostGitCommit = config.get("vagrant_hostGitCommit");
vagrant.env.wwwuserUsername = config.get("vagrant_wwwuserUsername");
vagrant.env.wwwuserPassword = config.get("vagrant_wwwuserPassword");
vagrant.env.mysqlRootPassword = config.get("database_password");
 
vagrant.consoleLogFile = path.resolve("./vagrant.stdout.txt");  // supported by custom changes to vagrant


vagrant.getSshConnection = function(configOverrides) {

    return vagrant.getVagrantSshConfig()
    .then(function(sshConfig) {

        var deferred = Q.defer();
        var connection = new Ssh2Connection();

        connection.on('error', function(err) {
            deferred.reject(err);
        });

        connection.on('ready', function() {
            deferred.resolve(connection);
        });

        var ssh2Params = {
            host: sshConfig.hostName,
            port: sshConfig.port,
            username: sshConfig.user,
            privateKey: sshConfig.privateKey
        };

        if (configOverrides) {
            for (var key in configOverrides) {
                if (configOverrides.hasOwnProperty(key)) {
                    ssh2Params[key] = configOverrides[key];
                }
            }
        }

        connection.connect(ssh2Params);

        return deferred.promise;
    });
};

vagrant.getVagrantSshConfig = function() {

    var sshConfig = {};

    return Q()
    .then(function() {
        return Q.ninvoke(vagrant, "ssh-config", "default");
    })
    .then(function(configConsoleOut) {

        var configRegex = /^\s\s([^\s]+)\s(.+)$/;

        var changeCase = require("change-case");

        configConsoleOut.forEach(function(line) {

            var regexResults = configRegex.exec(line);

            if (regexResults) {
                sshConfig[changeCase.camelCase(regexResults[1])] = regexResults[2];
            }
        });
    })
    .then(function() {
        return Q.ninvoke(fs, "readFile", sshConfig.identityFile);
    })
    .then(function(privateKey) {
        
        sshConfig.privateKey = privateKey;

        return sshConfig;
    });
};

vagrant.executeSshCommand = function(connection, command, traceOutput) {

    return Q.ninvoke (connection, 'exec', command)
    .then(function(stream) {

        var deferred = Q.defer();

        var output = "";
        var exitCode = 1;
        var exitSignal = "exit event not received";

        stream.setEncoding('utf8');
        stream.stderr.setEncoding('utf8');

        stream.on('exit', function(code, signal) {
            exitCode = code;
            exitSignal = signal;
        });

        stream.on('data', function(data) {
            output += data;
        });
        stream.stderr.on('data', function(data) {
            output += data;
        });

        stream.on("close", function() {

            if (exitCode === 0) {

                if (traceOutput) {
                    console.log("command '" + command + "' had output:");
                    console.log(output);
                }

                deferred.resolve();
            } else {

                console.log();
                console.log("ssh exec failed for " + command + ", output was:");
                console.log(output);

                deferred.reject('Ssh command ' + command + ' exited with code ' + exitCode + ', signal: ' + exitSignal);
            }
        });

        return deferred.promise;
    });
};

vagrant.truncateLogFile = function() {
    // Truncate the log file
    return Q.ninvoke(fs, "open", vagrant.consoleLogFile, 'w+')
    .then(function(fd) {
        return Q.ninvoke(fs, "close", fd);
    });
};
