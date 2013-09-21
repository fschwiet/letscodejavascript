
var fs = require('fs');
var Q = require("q");

module.exports = function(source, target, modifier) {

	return Q()
	.then(function() {
		return Q.nfcall(fs.readFile, source, 'utf8');
	})
	.then(function(originalContents) {

		var value = JSON.parse(originalContents);
		modifier(value);
		var modifiedContents = JSON.stringify(value, null, 4);

		return Q.nfcall(fs.writeFile, target, modifiedContents, {
			encoding: 'utf8'
		});
	});
};