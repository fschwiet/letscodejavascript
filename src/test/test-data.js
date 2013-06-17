
var fs = require("fs");
var jade = require("jade");
var path = require("path");


exports.load = function(template, content) {

    var filename = path.resolve(__dirname, "data", template + ".jade");
    var fileContents = fs.readFileSync(filename);

    return jade.compile(fileContents, {
        filename : filename,
        pretty: true
    })(content);
};