
var expect = require("expect.js");
var fs = require('fs');
var temporary = require("temporary");

var copyModifiedJson = require("./copy-modified-json.js");
var NodeunitBuilder = require("./nodeunit-builder.js");

var scope = new NodeunitBuilder(exports, "meh");


scope.test("can copy a json file with modifications", function(){

	var originalFile = new temporary.File();
	var targetPath = originalFile.path + ".modified";

	fs.writeFileSync(originalFile.path, JSON.stringify({
		a:'a',
		b:'b',
		c:'c'
	}), {
		encoding: 'utf8'
	});

	return copyModifiedJson(originalFile.path, targetPath, function(value) {
		value.c = 'C';
		value.d = 'D';
	})
	.then(function() {
		var newContents = JSON.parse(fs.readFileSync(targetPath));

		expect(newContents).to.eql({
			a: 'a',
			b: 'b',
			c: 'C',
			d: 'D'
		});
	})
	.then(function() {
		originalFile.unlinkSync();
		fs.unlinkSync(targetPath);
	});
});
