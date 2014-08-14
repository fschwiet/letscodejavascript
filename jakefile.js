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
var Q = require("q");
var request = require("request");
var os = require("os");
var nodeVersion = new(require("node-version").version)();
var util = require("util");
var beautify = require('js-beautify');

var exec = require("child-process-promise").exec;
var spawn = require("child-process-promise").spawn;


var config = require("./src/config.js");
var vagrant = require("./src/vagrant.js");

var copyModifiedJson = require("cauldron").copyModifiedJson;
var gitUtil = require("cauldron").gitUtil;

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
task("test", ["testClient", "testSmoke", "testRemaining", "testSlow"]);

task("testClient", ["lint"], function() {

    return karma.runTests(path.resolve("./build/karma/karma.conf.js"));
});

function runTestsWithNodeunit(testList) {

    return Q()
    .then(function() {
        if (config.get('useVagrantHost')) {

            var deferred = Q.defer();

            var taskToRun = jake.Task.forwardTestPorts;

            taskToRun.addListener('complete', function() {
                deferred.resolve();
            });

            taskToRun.addListener('error', function(err) {
                deferred.reject(err);
            });

            taskToRun.invoke();

            return deferred.promise;
        }
    })
    .then(function() {

        var deferred = Q.defer();

        var reporter = nodeunit.reporters["default"];
        reporter.run(testList, null, function(failures) {
            if (failures) {
                deferred.reject(failures);
            } else {
                deferred.resolve();
            }
        });

        return deferred.promise;
    });
}

task("commonTestPrequisites", ["lint", "prepareTestDatabase", "buildClientBundle"], function() {});

task("testSlow", ["commonTestPrequisites"], function() {

    var testList = listNonImportedFiles();

    testList.include(slowTests);
    testList.exclude(clientCode);

    return runTestsWithNodeunit(testList.toArray());
});

task("testSmoke", ["commonTestPrequisites"], function() {

    var testList = listNonImportedFiles();

    testList.include(smokeTests);
    testList.exclude(clientCode);

    return runTestsWithNodeunit(testList.toArray());
});

task("testRemaining", ["commonTestPrequisites"], function() {

    var testList = listNonImportedFiles();

    testList.include(allTests);

    testList.exclude(clientCode);
    testList.exclude(slowTests);
    testList.exclude(smokeTests);

    return runTestsWithNodeunit(testList.toArray());
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

task("deploySiteToVirtualMachine", function() {

    return vagrant.getSshConnection({
        username: config.get("vagrant_wwwuserUsername"),
        password: config.get("vagrant_wwwuserPassword"),
        privateKey: null
    })
    .then(function(connection) {
        return Q()
        .then(function() {
            return vagrant.executeSshCommand(connection, 'mkdir /cumulonimbus/sites/letscodejavascript.config');
        })
        .then(function() {
            return vagrant.executeSshCommand(connection, 'cp /vagrant/host.config/* /cumulonimbus/sites/letscodejavascript.config/');
        })
        .then(function() {
            return vagrant.executeSshCommand(connection, 'git clone /vagrant /cumulonimbus/sites/letscodejavascript');
        })
        .then(function() {
            return vagrant.executeSshCommand(connection, 'cd /cumulonimbus; ./link-config-folder.sh letscodejavascript /cumulonimbus/sites/letscodejavascript.config');
        })
        .then(function() {

            var passwordInsert = '';
            var databasePassword = config.get("database_password");
            if (databasePassword) {
                passwordInsert = '-p"' + databasePassword +'"';
            }

            return vagrant.executeSshCommand(connection, 'mysql -u "root" ' + passwordInsert +' -e "CREATE DATABASE TESTTEMP"');
        })
        .then(function() {
            return vagrant.executeSshCommand(connection, 'cd /cumulonimbus; ./deploy.sh letscodejavascript cumu');
        })
        .fin(function() {
            connection.end();
        });
    });
});

task("recreateVirtualMachine", function() {

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

        return vagrant.truncateLogFile();
    })
    .then(function() {
        console.log("Creating current vagrant environment");
        return Q.ninvoke(vagrant, "up");
    })
    .then(function() {
    });
});

task("forwardTestPorts", ["requireVagrantHost"], function() {

    var portsToForward = [
        [config.get("smtp_host"), config.get("smtp_port")], 
        [config.get("fakeServer_hostName"), config.get("fakeServer_port")]
    ];

    var commands = portsToForward.map(function(entry) {
        return vagrant.openSshTunnel(entry[1] + ":" + entry[0] + ":" + entry[1]);
    });

    return commands.reduce(Q.when, Q());
});


task("deploySite", ["lint", "recreateVirtualMachine", "deploySiteToVirtualMachine"], function() {
});

task("requireVagrantHost", function() {
    if (!config.get('useVagrantHost')) {
        throw new Error("Task expected use-vagrant-host=true");
    }
});

task("vagrantTest", ["requireVagrantHost", "testSmoke","test"]);

task("mergeIntoRelease", ["verifyEmptyGitStatus"], function() {

    return Q()
    .then(function() {
        return exec("git ls-remote --exit-code origin")
        .fail(function() {
            throw new Error('A git remote named "origin" is required.');
        });

    })
    .then(function() {
        return exec("git show-ref --verify --quiet refs/heads/release")
        .fail(function() {
            return exec("git checkout --track origin/release")
            .then(function() {
                return exec("git checkout @{-1}");
            });
        })
    })
    .then(function() {
        return exec("git branch head --contains release");
    })
    .then(function(branchOutput) {

        assert.equal(branchOutput.stderr.length, 0, "Encountered error verifying current git head to contain release branch.");
        assert.equal(branchOutput.stdout.length, 0, "Expected current git head to contain the release branch.");
    })
    .then(function(currentHead) {
        return exec("git checkout release")
    })
    .then(function() {
        return exec("git merge --no-ff --log @{-1}");
    })
    .then(function() {
        return exec("git checkout @{-1}");
    })
    .then(function() {
        return exec("git merge release");
    });        
});

task("doFinalTest", ["requireVagrantHost", "deploySite", "vagrantTest", "mergeIntoRelease"], function() {
});

