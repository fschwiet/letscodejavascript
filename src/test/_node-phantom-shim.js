(function() {
  "use strict";

  var setup = require("../test/setup");
  var assert = require("assert");
  var express = require("express");
  var http = require('http');
  var Q = require("q");
  
  var app = express();    
  var server;

  var port = 8081;

  exports.setUp = function(callback) {

    app.get("/empty", function(req, res) {
      res.send("<html><head><title>lol hmm</title></head><body></body></html>");
    });

    app.get("/multiple", function(req, res) {
      res.send("<html><body><a class='target'></a><a class='target'></a></body></html>");
    });

    server = http.createServer(app);
    server.listen(port, callback);
  };

  exports.tearDown = function(callback) {
    if (server) {
        server.close(callback);
        server = null;
    }
  };

  exports.clickElement = {};

  setup.qtest(exports.clickElement, "should give useful error when not found", setup.usingPhantom(
  function(phantom) {
    return phantom.promise.createPage()
      .then(
        function(page) {
          return page.promise.open("http://localhost:8081/empty")
            .then(function(status) {
              assert.equal(status, "success");
            })
            .then(function() {
              var deferred = Q.defer();

              setTimeout(function() { console.log("finished timeout"); deferred.resolve();}, 5000);

              return deferred.promise;
            })
            .then(function() {
              return page.promise.evaluate(function() {
                return document.title;
              });
            })
            .then(function(content) {
              console.log("document.title was " + content);
            })
            .then(function() {
              return page.promise.evaluate(function() {
                return document.body.innerHTML;
              });
            })
            .then(function(content) {
              console.log("document.body.innerHTML was " + content);
            })
            .then(function(staus) {
              console.log("clicking link");
              return page.promise.clickElement("a.target");
            });
        })
      .then(function() {
          console.log("throwing exception");
          throw new Error("Expected exception");
        }, 
        function(err) {
          assert.notEqual(err.toString().indexOf("An element matching 'a.target' not found"), -1, "Should give better errorstring, actual was " + err.toString());
        });
  }));

  setup.qtest(exports.clickElement, "should give useful error when multiple found", setup.usingPhantom(
    function(phantom) {
    return phantom.promise.createPage()
      .then(
        function(page) {
          return page.promise.open("http://localhost:8081/multiple")
            .then(function(status) {
              assert.equal(status, "success");
            })
            .then(function(staus) {
              return page.promise.clickElement("body");
            });
        })
      .then(function() {
        throw new Error("Expected exception");
      }, 
      function(err) {
        assert.equal(1,0, err.toString());
        assert.notEqual(err.toString().indexOf("More than one elements matching 'a.target' were found"), -1, "Should give better errorstring, actual was " + err.toString());
      });
  }));

  setup.qtest(exports.clickElement, "should click element when found", setup.usingPhantom(function(phantom) {
    return phantom.promise.createPage();
  }));

})();

