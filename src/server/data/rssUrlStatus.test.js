
var assert = require("assert");
var Q = require("q");

var database = require("../database.js");
var dataRssUrlStatus = require("./rssUrlStatus.js");


var NodeunitBuilder = require("cauldron").nodeunit;
var scope = new NodeunitBuilder(exports, "meh");

scope.test("Should be able to save status", function() {

    var rssUrl = "http://someserver.com/rss";
    var otherUrl = "http://someserver.com/other";
    var originTime = new Date();

    return Q()
    .then(function() {
        return dataRssUrlStatus.checkIfUrlNeedsUpdate(rssUrl, originTime);
    })
    .then(function(result){
        assert.equal(result, true, "Initially the url needs an update");
    })
    .then(function() {
        return dataRssUrlStatus.writeRssUrlStatus(rssUrl, "ok", originTime);
    })
    .then(function() {
        return dataRssUrlStatus.checkIfUrlNeedsUpdate(rssUrl, originTime);
    })
    .then(function(result){
        assert.equal(result, false, "After the update, the url does not need an update");
    })
    .then(function() {
        return dataRssUrlStatus.checkIfUrlNeedsUpdate(rssUrl, new Date(originTime.getTime() + 60 * 60 * 1000));
    })
    .then(function(result){
        assert.equal(result, false, "After an hour, the url does not need an update");
    })
    .then(function() {
        return dataRssUrlStatus.checkIfUrlNeedsUpdate(rssUrl, new Date(originTime.getTime() + 3 * 60 * 60 * 1000));
    })
    .then(function(result){
        assert.equal(result, true, "After three hours, the url needs an update");
    })
    .then(function() {
        return dataRssUrlStatus.checkIfUrlNeedsUpdate(otherUrl, originTime);
    })
    .then(function(result){
        assert.equal(result, true, "Other urls are not affected by state");
    });
});

