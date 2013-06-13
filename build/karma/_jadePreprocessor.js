
var path = require('path');
var jadePreprocessor = require("./jadePreprocessor");
var assert = require('assert');
var fs = require('fs');

exports["can process jade files"] = function(test) {

    var baseDir =  path.resolve(__dirname, "../../src/server/views");
    var jadeFile = path.resolve(__dirname, "../../src/server/views/index.jade").replace((/\\/g), "/");

    // some preprocessors write to file.path
    var file = {
        path : jadeFile,
        originalPath : jadeFile
    };

    /*  The 2nd parameter, the "file", had the below form when testing:
    
        {
            "path": "C:/src/letscodejavascript/views/feeds.jade",
            "originalPath": "C:/src/letscodejavascript/views/feeds.jade",
            "contentPath": "C:\\Users\\user\\AppData\\Local\\Temp/fb08878bbad485100ba7bc8e92836eace619206d.js",
            "mtime": "2013-06-12T19:06:02.000Z",
            "isUrl": false
        }

        The result ended up being written to contentPath.
    */

    jadePreprocessor(fs.readFileSync(jadeFile, "utf8"), file, baseDir, function(result) {
        test.equal(typeof result, "string");
        assert.equal(file.path, jadeFile + ".js");  // view.jade will be served as view.jade.js
        test.done();
    });
};