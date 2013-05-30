(function() {
  "use strict";

  var assert = require("assert");
  var express = require("express");
  var http = require('http');
  
  var app = express();    
  var server;

  var port = 8080;

  exports.setUp = function(callback) {
    server = http.createServer(app);
    server.listen(port, callback);
  };

  exports.tearDown = function(callback) {
    if (server) {
        server.close(callback);
        server = null;
    }
  };

  //var it = setup.usePromisesForTests(exports.clickElement = {});

  exports.clickElement = {};
  
  setup.testPromise(exports.clickElement, "should give useful error when not found", setup.usingPhantom(function(phantom) {

  }));

  setup.testPromise(exports.clickElement, "should give useful error when multiple found", setup.usingPhantom(function(phantom) {

  }));

  setup.testPromise(exports.clickElement, "should click element when found", setup.usingPhantom(function(phantom) {
    
  }));

})();

