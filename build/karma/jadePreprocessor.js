
var fs = require("fs");
var jade = require("jade");

module.exports = function(content, file, basePath, done) {

    file.path = file.path + '.js';

    var jadeOptions = {
        filename: file.originalPath,
        client: true,
        pretty: true
    };

    done("define(['jadeRuntime'], function(jade) { return " + jade.compile(content, jadeOptions) +"; });");
};