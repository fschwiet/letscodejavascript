var nodeunit = require('nodeunit');
var assert = require('assert');
var karma = require('./build/karma/karma');
var mysql = require('mysql');
var database = require("./src/server/database.js");
var path = require("path");
var find = require("find");
var fs = require('fs-extra');
var rimraf = require("rimraf");
var childProcess = require("child_process");
var config = require("./src/server/config.js");
var Q = require("q");
var request = require("request");
var os = require("os");
var nodeVersion = new(require("node-version").version)();
var util = require("util");
var runServer = require("./src/test/runServer.js");
var beautify = require('js-beautify');

var copyModifiedJson = require("cauldron").copyModifiedJson;
var gitUtil = require("cauldron").gitUtil;
var spawnProcess = require("cauldron").spawnProcess;

var jadePreprocessor = require("./build/karma/jadePreprocessor.js");

var allTests = "**/*.test.js";
var slowTests = "**/*.slow.test.js";
var smokeTests = "**/*.smoke.test.js";
var clientCode = "src/client/**";

task = require("./build/jake-util.js").extendTask(task, jake);

task("default", ["verifyNodeVersion", "lint", "writeSampleConfig", "test"], function() {});

task("verifyClientCode", ["lint", "testClient"], function() {});


desc("lint");
task("lint", function() {

    var list = listNonImportedFiles();
    list.include("**/*.js");
    list.exclude("jadeRuntime.js");

    var runner = require("./build/lint/lint_runner.js");

    var a = runner.validateFileList(list, { 
        evil: true  // allowing eval, only used in test code so far
    });
    assert.ok(a, "lint failed");
});

desc("Formats javascript files.");
task("beautify", ["verifyEmptyGitStatus"], function() {

    var list = listNonImportedFiles();
    list.include("**/*.js");

    var readFile = Q.nbind(fs.readFile);
    var writeFile = Q.nbind(fs.writeFile);

    var promises = list.toArray().map(function(filename) {
        return readFile(filename, "utf8")
            .then(function(contents) {
                return writeFile(filename, beautify(contents, {
                            indent_size: 4
                        }));
            });
    });

    return Q.all(promises);
});

desc("write sample config file");
task("writeSampleConfig", function() {

    var defaults = config.getDefaults();

    fs.writeFileSync("./sample.config.json", JSON.stringify(defaults, null, "    "));
});

desc("test everything");
task("test", ["testClient", "testRemaining", "testSmokeAsRegularTest", "testSlow"]);

task("testClient", function() {

    return karma.runTests(path.resolve("./build/karma/karma.conf.js"));
});

function runTestsWithNodeunit(testList) {
    var reporter = nodeunit.reporters["default"];
    reporter.run(testList, null, function(failures) {
        assert.ifError(failures);
        complete();
    });
}

task("commonTestPrequisites", ["lint", "prepareTestDatabase", "buildClientBundle"], function() {});

task("testSlow", ["commonTestPrequisites"], function() {

    var testList = listNonImportedFiles();

    testList.include(slowTests);
    testList.exclude(clientCode);

    runTestsWithNodeunit(testList.toArray());
}, {
    async: true
});

task("testSmokeAsRegularTest", ["commonTestPrequisites", "startSmokeServer", "testSmoke", "stopSmokeServer"], function() {});

task("testSmoke", function() {

    var testList = listNonImportedFiles();

    testList.include(smokeTests);
    testList.exclude(clientCode);

    runTestsWithNodeunit(testList.toArray());
}, {
    async: true
});

task("startSmokeServer", function() {

    runServer.startServerLikeIIS(complete);
}, {
    async: true
});

task("stopSmokeServer", function() {

    runServer.stopServer(complete);
}, {
    async: true
});

task("testRemaining", ["commonTestPrequisites"], function() {

    var testList = listNonImportedFiles();

    testList.include(allTests);

    testList.exclude(clientCode);
    testList.exclude(slowTests);
    testList.exclude(smokeTests);

    runTestsWithNodeunit(testList.toArray());
}, {
    async: true
});

task("createTestDatabase", function() {

    database.ensureTestDatabaseIsClean(function(err) {
        assert.ifError(err);
        complete();
    });
}, {
    async: true
});

task("prepareTestDatabase", ["createTestDatabase", "runMigrations"]);


//  The dependency on default is only there to be sure karma client and server
//  are running from our local directory, so it doesn't get started from the
//  working directory used during release.

desc("test all the things");
task("testForRelease", ["default"], function() {

    var workingDirectory = path.join(os.tmpdir(), "letscodejavascript-testForRelease");

    fs.removeSync(workingDirectory);
    fs.mkdirSync(workingDirectory);

    return gitUtil.gitCloneTo(workingDirectory)
    .then(function() {
        fs.copySync("./config.json", path.join(workingDirectory, "config.json"));
    })
    .then(function() {
        return spawnProcess("node", [path.resolve(workingDirectory, ".\\node_modules\\jake\\bin\\cli.js"), "default"], {cwd: workingDirectory});
    });
});


desc("Deploys to IIS after checking smoke tests.");
task("deployToIIS", ["verifyEmptyGitStatus", "testForRelease"], function() {

    var productionConfig = config.get("deployment_configFile");
    var deployRoot = config.get("deployment_basePath");

    if (!fs.existsSync(productionConfig)) {
        fail("Could not find file production.config.json, please create before deploying.  Consider using sample.config.json as a starting point.");
    }

    if (!fs.existsSync(deployRoot)) {
        fs.mkdirsSync(deployRoot);
    }

    var countWithinDeployRoot = fs.readdirSync(deployRoot).length;

    if (countWithinDeployRoot > 256) {
        fail("Deploying to a full directory.  Please clean up " + deployRoot + " first.");
    }

    return gitUtil.getGitCurrentCommit()
    .then(function(id) {

        console.log("deploying git commit", id);

        var deployPath = gitUtil.getAvailableDirectory(path.resolve(deployRoot, id));

        fs.mkdirsSync(deployPath);

        console.log("Deploying to " + deployPath);

        return gitUtil.gitCloneTo(deployPath)
            .then(function() {
                    return Q.nbind(fs.readFile)(productionConfig, {
                            encoding: "utf8"
                        });
                })
            .then(function(configValues) {

                    try {
                        configValues = JSON.parse(configValues);
                    } catch (err) {
                        throw new Error("Error parsing " + productionConfig + ": " + err.toString());
                    }

                    function getProductionConfig(name) {
                        if (!(name in configValues)) {
                            throw new Error("Production configuration is missing setting " + name);
                        }

                        return configValues[name];
                    }

                    var deploymentName = getProductionConfig("server_friendlyName");
                    var smoketest_hostname = getProductionConfig("server_hostname");
                    var smoketest_port = config.get("deployment_smoketestPort");
                    var final_hostname = getProductionConfig("server_hostname");
                    var final_port = getProductionConfig("server_port");

                    configValues.server_port = smoketest_port;

                    if ((configValues.server_sessionKey || "").length < 15) {

                        throw new Error("Configuration should contain a good server_sessionKey");
                    }

                    return Q.nbind(fs.writeFile)(path.resolve(deployPath, "config.json"), JSON.stringify(configValues, null, "    "))
                        .then(function() {

                            console.log("running database migrations");
                            return spawnProcess("node", ["./node_modules/jake/bin/cli.js", "runMigrations"], {
                                    cwd: deployPath
                                });
                        })
                        .then(function() {
                            console.log("building client script bundle");
                            return spawnProcess("node", ["./node_modules/jake/bin/cli.js", "buildClientBundle"], {
                                    cwd: deployPath
                                });
                        })
                        .then(function() {
                            var iisPath = path.join(deployPath, "src/iis");
                            var iisInstallArgs = ["-noprofile", "-file", "./src/iis/install.ps1", deploymentName + " (smoke)", iisPath, smoketest_hostname, smoketest_port];

                            console.log("calling execFile on ./src/iis/install.ps1", iisInstallArgs);

                            return Q.nbind(childProcess.execFile)("powershell", iisInstallArgs, {
                                    env: process.env
                                });
                        })
                        .then(assertExecFileSucceeded)
                        .then(function() {

                            console.log("starting smoke tests");
                            return spawnProcess("node", ["./node_modules/jake/bin/cli.js", "testSmoke"], {
                                    cwd: deployPath
                                });
                        })
                        .then(function() {
                            configValues.server_port = final_port;

                            return Q.nbind(fs.writeFile)(path.resolve(deployPath, "config.json"), JSON.stringify(configValues, null, "    "));
                        })
                        .then(function() {
                            var iisPath = path.join(deployPath, "src/iis");
                            var iisInstallArgs = ["-noprofile", "-file", "./src/iis/install.ps1", deploymentName, iisPath, final_hostname, final_port];

                            console.log("calling execFile on ./src/iis/install.ps1", iisInstallArgs);

                            return Q.nbind(childProcess.execFile)("powershell", iisInstallArgs, {
                                    env: process.env
                                });
                        })
                        .then(assertExecFileSucceeded)
                        .then(function() {

                            //  sad workaround:  the iis-hosted node application doesn't recognize the configuration change
                            //  until after iisreset (the configuration is written before the iis site is created, so this seems
                            //  like a iis, iisnode issue)

                            console.log("running iisreset");

                            return Q.nbind(childProcess.execFile)("iisreset");
                        })                        
                        .then(assertExecFileSucceeded)
                        .then(complete);
                });

    });
});

function assertExecFileSucceeded(execFileResults) {

    var stdout = execFileResults[0];
    var stderr = execFileResults[1];

    console.log("stdout:\n" + stdout.toString());

    if (stderr.trim().length > 0) {
        throw new Error("Have error output: " + stderr.toString());
    }
}


desc("Verifies there are no uncommitted changes");
task("verifyEmptyGitStatus", function() {

    return gitUtil.verifyEmptyGitStatus();
});

desc("Verify node version.");
task("verifyNodeVersion", function() {

    var actualVersion = nodeVersion.getVersion().original.toString().trim();
    var expectedVersion = fs.readFileSync("./.node-version").toString().trim();

    if (actualVersion !== expectedVersion) {
        fail(util.format("Expected node --version to be %s, actually was %s", expectedVersion, actualVersion));
    }

    console.log("Node version is " + actualVersion);
});

desc("Run the server locally");
task("runServer", ["compileJadeViews"], function() {
    var port = config.get("server_port");
    console.log("running the server on", port);
    var server = require("./src/server/server.js");
    server.start(port);
}, { async:true});

var clientBundle = path.resolve(__dirname + "/temp/main-built.js");

desc("compiles jade views");
task("compileJadeViews", function() {

    var root = path.resolve(__dirname + "/src/server/views");
    var newRoot = path.resolve(__dirname + "/temp/views");

    var files = find.fileSync((/\.jade/), root);

    files.forEach(function(file) {
        var target = file.replace(root, newRoot) + ".js";

        fs.mkdirsSync(path.resolve(target, ".."));

        var compiledContent = jadePreprocessor.compile(file);
        fs.writeFileSync(target, compiledContent);
    });
});

desc("Builds a compiled version of client-side script");
task("buildClientBundle", ["compileJadeViews"], function() {

    console.log("building " + clientBundle);

    var requirejs = require('requirejs');

    var config = require("./src/client/app-build");

    requirejs.optimize(config, function (buildResponse) {
        console.log(buildResponse);
        var contents = fs.readFileSync(config.out, 'utf8');
        complete();
    }, function(err) {
        fail(err);
    });    
}, {
    async: true
});

desc("Run database migrations");
task("runMigrations", ["lint"], function() {

    return database.runMigrations(os.tmpdir(), "./src/migrations", ["up"]);
});

desc("Reverts 1 database migrations");
task("runOneMigrationDown", function() {

    return database.runMigrations(os.tmpdir(), "./src/migrations", ["down", "--count", "1"]);
});

function listNonImportedFiles() {
    var list = new jake.FileList();
    list.exclude("node_modules");
    list.exclude("temp");
    list.exclude("lib");
    list.exclude("clientLib");
    return list;
}

var vagrant = require("vagrant");
var Ssh2Connection = require("ssh2");

vagrant.start = path.resolve("./host")
vagrant.env = JSON.parse(JSON.stringify(vagrant.env))

vagrant.env.hostGitUrl = "https://github.com/fschwiet/cumulonimbus-host"
vagrant.env.hostGitCommit = "master"
vagrant.env.wwwuserUsername = "wwwuser"
vagrant.env.wwwuserPassword = "password"


function getVagrantSshConfig() {

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
}

function executeSshCommand(connection, command, traceOutput) {

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

            if (exitCode == 0) {

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
}

task("postVagrantUp", function() {

    return getVagrantSshConfig()
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
            port: sshConfig.port
            //username: sshConfig.user,
            //privateKey: sshConfig.privateKey
        };
        ssh2Params.username = "wwwuser";
        ssh2Params.password = "password";

        connection.connect(ssh2Params);

        return deferred.promise;
    })
    .then(function(connection) {
        return Q()
        .then(function() {
            return executeSshCommand(connection, 'git clone /vagrant /cumulonimbus/sites/letscodejavascript');
        })
        .then(function() {
            return executeSshCommand(connection, 'cd /cumulonimbus; ./deploy.sh letscodejavascript cumu');
        })
        .fin(function() {
            connection.end();
        });
    });
});

task("cleanVagrant", function() {

    var statuses = {};

    var statusRegex = /^([^\s]+)\s+(.+)\s\(([^\s]+)\)$/;

    return Q.ninvoke(vagrant, "status")
    .then(function(result) {
        result.forEach(function(line) {
            var regexResults = statusRegex.exec(line);
            if (regexResults) {
                statuses[regexResults[1]] = {
                    status: regexResults[2],
                    provider: regexResults[3]
                };
            }
        });

        if (!statuses['default'] || statuses['default'].provider != 'virtualbox') {
            console.log(result.join("\n"));
            throw new Error("Expected default vagrant box to be using virtualbox provider");
        }
        console.log("Verified vagrant is running on virtualbox");
    })
    .then(function() {
        console.log("Destroying current vagrant environment");
        return Q.ninvoke(vagrant, "destroy", "-f");
    })
    .then(function() {

        vagrant.consoleLogFile = path.resolve("./vagrant.stdout.txt");

        // Truncate the log file
        return Q.ninvoke(fs, "open", vagrant.consoleLogFile, 'w+')
        .then(function(fd) {
            return Q.ninvoke(fs, "close", fd);
        });
    })
    .then(function() {
        console.log("Creating current vagrant environment");
        return Q.ninvoke(vagrant, "up");
    })
    .then(function() {
        return Q.ninvoke
    });
});