(function() {
  "use strict";

  var setup = require("../test/setup");
  var assert = require("assert");
  var express = require("express");
  var http = require('http');
  var Q = require("q");
  var nconf = require("../server/config.js");
  var waitUntil = require("./waitUntil.js");

  var app = express();    
  var server;

  var port = nconf.get("server_port");

  exports.setUp = function(callback) {

    app.get("/empty", function(req, res) {
      res.send("<html><head><title>lol hmm</title></head><body>This page has no links.</body></html>");
    });

    app.get("/multiple", function(req, res) {
      res.send("<html><body><a class='target'></a><a class='target'></a></body></html>");
    });

    app.get("/links-to-empty", function(req, res) {
      res.send("<html><body><a class='target' href='/empty'>click me</a></body></html>");
    });

    server = http.createServer(app);
    server.listen(port, callback);
  };

  exports.tearDown = function(callback) {
    console.log("running tearDown");
    if (server) {
      server.close(callback);
      server = null;
    }
  };

/*
  require("nodeunit").on('complete', function() {
    console.log("complete event");
    setup.clearPhantomCache();
  });
*/
  exports.clickElement = {};

  setup.qtest(exports, "should pass arguments to evaluate correctly", setup.usingPhantom(function(page) {

    return page.promise.evaluate(function(a,b,c) {
      return a + b + c;
    },1,2,3)
    .then(function(result) {
      assert.equal(result, 6);
    });
  }));

  setup.qtest(exports, "should be able to load page content as a string", setup.usingPhantom(function(page) {
    return page.promise.open("http://localhost:" + port + "/empty")
      .then(function(status) {
        assert.equal(status, "success");
      })
      .then(function() {
        return page.promise.get("content");
      })
      .then(function(content) {
        assert.ok(content.indexOf("This page has no links") > -1, "Expected page content");
      });
  }));

  setup.qtest(exports.clickElement, "should give useful error when not found", setup.usingPhantom(function(page) {
    return setup.shouldFail(function() {
      return page.promise.open("http://localhost:" + port + "/empty")
      .then(function(status) {
        assert.equal(status, "success");
      })
      .then(function() {
        return page.promise.clickElement("a.target");
      });
    }, "An element matching 'a.target' not found");
  }));

  setup.qtest(exports.clickElement, "should give useful error when multiple found", setup.usingPhantom(function(page) {
    return setup.shouldFail(function() {
      return page.promise.open("http://localhost:" + port + "/multiple")
      .then(function(status) {
        assert.equal(status, "success");
      })
      .then(function() {
        return page.promise.clickElement("a.target");
      });
    }, "More than one elements matching 'a.target' were found");
  }));

  setup.qtest(exports.clickElement, "should click element when found", setup.usingPhantom(function(page) {
    return page.promise.open("http://localhost:" + port + "/links-to-empty")
    .then(function(status) {
      assert.equal(status, "success");
    })
    .then(function() {
      return page.promise.clickElement("a.target");
    })
    .then(function() {
      var start = new Date();
      return waitUntil("browser is redirected to /empty", function() { 
          return page.promise.get("url").then(function(url) {
              console.log("url was", url);
              return url == "http://localhost:" + port + "/empty";
          });
      }, 1000);
    });
  }));
})();

