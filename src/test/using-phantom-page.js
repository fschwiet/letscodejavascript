
var path = require('path');

var NodeunitBuilder = require("./nodeunit-builder.js");
var phantom = require("./node-phantom-shim.js");


module.exports = NodeunitBuilder.createTestScopeExtender(
    "using phantom page",
    function(done) {

        var that = this;

        phantom
            .create()
            .then(function(phantom) {

                phantomRef = phantom;

                return phantom.createPage()
                    .then(function(page) {
                        that.page = page;

                        page.onConsoleMessage = function(message) {
                            console.log("phantomsjs console.log:", message);
                        };

                        page.onError = function(message) {
                            console.log("phantomjs error:", message);
                        };
    
                        that.promiseErrorHandlers = that.promiseErrorHandlers || [];
                        that.promiseErrorHandlers.push(function() {
                            var screenshotPath = path.resolve(".", "test-screenshot.jpg");
                            return that.page.render(screenshotPath)
                            .then(function(){
                                console.log("wrote screenshot to", screenshotPath);
                            }, function(renderError) {
                                console.log ("error writing screenshot:", renderError);
                            });
                        });
                    });
            })
            .then(function() {
                done();
            }, function(err) {
                done(err);
            });
    },
    function(done) {

        if (typeof phantomRef !== "undefined") {
            phantomRef.exit();
        }

        done();
    });