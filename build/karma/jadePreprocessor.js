
var fs = require("fs");
var jade = require("jade");

module.exports = function(content, file, basePath, done) {

    var jadeOptions = {
        filename: file.originalPath,
        client: true
    };

    done("module.exports = " + jade.compile(content, jadeOptions) +";");
};