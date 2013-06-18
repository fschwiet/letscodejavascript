var fs = require("fs");
var jade = require("jade");

module.exports = function(content, file, basePath, done) {

    file.path = file.path + '.js';

    var result = compile(file.originalPath, content);

    done(result);
};

function compile(file, content) {

    content = content || fs.readFileSync(file);

    var jadeOptions = {
        filename: file,
        client: true,
        pretty: true
    };

    return "define(['jadeRuntime'], function(jade) { return " + jade.compile(content, jadeOptions) + "; });";
}

module.exports.compile = compile;