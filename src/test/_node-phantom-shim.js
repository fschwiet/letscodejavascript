(function() {
  "use strict";

  var setup = require("../test/setup");
  var assert = require("assert");
  var express = require("express");
  var http = require('http');
  var Q = require("q");
  var nconf = require("../server/config.js");

  var app = express();    
  var server;

  var port = nconf.get("testServer_port");

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

  require("nodeunit").on('complete', function() {
    console.log("complete event");
    setup.clearPhantomCache();
  });

  exports.clickElement = {};

  setup.qtest(exports, "should pass arguments to evaluate correctly", setup.usingPhantom(function(page) {

    return page.promise.evaluate(function(a,b,c) {
      return a + b + c;
    },1,2,3)
    .then(function(result) {
      assert.equal(result, 6);
    });
  }));

/*
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
        console.log("had content: " + content);
        debugger;
      });
  }));
/*

  setup.qtest(exports.clickElement, "should give useful error when not found", setup.usingPhantom(function(page) {
    return page.promise.open("http://localhost:" + port + "/multiple");
    return page.promise.open("http://localhost:" + port + "/empty");
    /*
    .then(function(status) {
      console.log("1");
      assert.equal(status, "success");
      console.log("2");
    });
    /*
    .then(function() {
      console.log("3");
      var result = page.promise.clickElement("a.target");
      console.log("4");
      return result;
    });
    /*
    .then(function() {
      console.log("5");
      throw new Error("Expected exception");
    }, 
    function(err) {
      console.log("6", err);
      //assert.equal(err.toString().indexOf("An element matching 'a.target' not found"), -1, "Should give better errorstring, actual was " + err);
      //console.log("7", err);
      //return err;
    });
  }));

  /*

  setup.qtest(exports.clickElement, "should give useful error when multiple found", setup.usingPhantom(function(page) {
    return page.promise.open("http://localhost:" + port + "/multiple")
    .then(function(status) {
      assert.equal(status, "success");
    })
    .then(function() {
      return page.promise.clickElement("a.target");
    })
    .then(function() {
      throw new Error("Expected exception");
    }, 
    function(err) {
      assert.ok(err.toString().indexOf("More than one elements matching 'a.target' were found") > -1, "Should give better errorstring, actual was " + err.toString());
    });
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
      return page.promise.get("url");
    })
    .then(function(url) {
      assert.equal(url, "http://localhost:" + port + "/empty");
    });
  }));
  */
})();

